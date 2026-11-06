package io.github.oluengo.usus;

import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;

import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Firma externa con Amber (NIP-55), como en Wavestr. Usus nunca ve la clave privada.
 * Primero se intenta en segundo plano (content provider, si el usuario dio permiso «siempre»);
 * si no, se abre Amber con un intent. La firma se comprueba en la web (nostr.js) antes de usarla.
 */
@CapacitorPlugin(name = "UsusSigner")
public class UsusSignerPlugin extends Plugin {
    private static final String DEFAULT_PACKAGE = "com.greenart7c3.nostrsigner";

    private Intent probe() { return new Intent(Intent.ACTION_VIEW, Uri.parse("nostrsigner:")); }

    @PluginMethod
    public void available(PluginCall call) {
        boolean ok;
        try { ok = !getContext().getPackageManager().queryIntentActivities(probe(), PackageManager.MATCH_DEFAULT_ONLY).isEmpty(); }
        catch (Exception e) { ok = false; }
        JSObject r = new JSObject(); r.put("ok", ok); call.resolve(r);
    }

    @PluginMethod
    public void getPublicKey(PluginCall call) {
        Intent i = probe();
        i.putExtra("type", "get_public_key");
        String perms = call.getString("permissions");
        if (perms != null) i.putExtra("permissions", perms);
        startActivityForResult(call, i, "onResult");
    }

    /** type: sign_event | nip44_encrypt | nip44_decrypt; content: evento JSON o texto; pubkey: la otra parte (cifrado). */
    @PluginMethod
    public void request(PluginCall call) {
        String type = call.getString("type", ""), content = call.getString("content", ""), pubkey = call.getString("pubkey", "");
        String current = call.getString("current", ""), pkg = call.getString("pkg");
        String op = "sign_event".equals(type) ? "SIGN_EVENT" : "nip44_encrypt".equals(type) ? "NIP44_ENCRYPT" : "nip44_decrypt".equals(type) ? "NIP44_DECRYPT" : null;
        if (op == null) { call.reject("type"); return; }
        JSObject silent = provider(pkg, op, new String[] { content, "sign_event".equals(type) ? "" : pubkey, current });
        if (silent != null) { call.resolve(silent); return; }
        Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse("nostrsigner:" + content));
        if (pkg != null && !pkg.isEmpty()) i.setPackage(pkg);
        i.putExtra("type", type);
        i.putExtra("current_user", current);
        if (!"sign_event".equals(type)) i.putExtra("pubkey", pubkey);
        String id = call.getString("id");
        if (id != null) i.putExtra("id", id);
        startActivityForResult(call, i, "onResult");
    }

    @ActivityCallback
    private void onResult(PluginCall call, ActivityResult result) {
        if (call == null) return;
        Intent d = result.getData();
        if (result.getResultCode() != Activity.RESULT_OK || d == null) { call.reject("rejected"); return; }
        JSObject r = new JSObject();
        for (String k : new String[] { "result", "signature", "event", "package" }) { String v = d.getStringExtra(k); if (v != null) r.put(k, v); }
        call.resolve(r);
    }

    private JSObject provider(String pkg, String op, String[] args) {
        try {
            Uri uri = Uri.parse("content://" + (pkg == null || pkg.isEmpty() ? DEFAULT_PACKAGE : pkg) + "." + op);
            try (Cursor c = getContext().getContentResolver().query(uri, args, null, null, null)) {
                if (c == null || c.getColumnIndex("rejected") >= 0 || !c.moveToFirst()) return null;
                JSObject r = new JSObject();
                for (String name : c.getColumnNames()) { int i = c.getColumnIndex(name); if (i >= 0) r.put(name, c.getString(i)); }
                return r.length() > 0 ? r : null;
            }
        } catch (Exception e) {
            return null;
        }
    }
}
