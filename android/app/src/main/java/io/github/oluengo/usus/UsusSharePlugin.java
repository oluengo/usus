package io.github.oluengo.usus;

import android.content.Intent;
import android.net.Uri;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

/** Lo que otra app comparte con Usus (texto, o un archivo de texto/JSON) se pasa a la web con el evento «shared».
 *  Sin permisos: el archivo llega con permiso de lectura temporal de la app que lo comparte. */
@CapacitorPlugin(name = "UsusShare")
public class UsusSharePlugin extends Plugin {
    private static final int MAX = 4 * 1024 * 1024;

    @Override
    public void load() { read(getActivity().getIntent()); }

    @Override
    protected void handleOnNewIntent(Intent intent) {
        super.handleOnNewIntent(intent);
        read(intent);
    }

    private void read(Intent it) {
        if (it == null || !Intent.ACTION_SEND.equals(it.getAction())) return;
        String text = it.getStringExtra(Intent.EXTRA_TEXT);
        Uri uri = it.getParcelableExtra(Intent.EXTRA_STREAM);
        if (uri != null) { String f = readUri(uri); if (f != null) text = f; }
        it.setAction(Intent.ACTION_MAIN);   // ya leído: no repetir al volver a la app
        if (text == null || text.trim().isEmpty()) return;
        JSObject d = new JSObject();
        d.put("text", text);
        notifyListeners("shared", d, true);   // se guarda hasta que la web escuche
    }

    private String readUri(Uri uri) {
        try (InputStream in = getContext().getContentResolver().openInputStream(uri)) {
            if (in == null) return null;
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            byte[] buf = new byte[8192];
            int n, total = 0;
            while ((n = in.read(buf)) > 0) { total += n; if (total > MAX) return null; out.write(buf, 0, n); }
            return new String(out.toByteArray(), StandardCharsets.UTF_8);
        } catch (Exception e) {
            return null;
        }
    }
}
