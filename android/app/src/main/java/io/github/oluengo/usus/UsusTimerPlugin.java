package io.github.oluengo.usus;

import android.Manifest;
import android.os.Build;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

/** Puente con UsusTimerService: la web manda el estado de la sesión y de la cuenta atrás; los botones de la notificación vuelven aquí. */
@CapacitorPlugin(name = "UsusTimer", permissions = @Permission(alias = "notifications", strings = { Manifest.permission.POST_NOTIFICATIONS }))
public class UsusTimerPlugin extends Plugin {
    private static UsusTimerPlugin me;

    @Override public void load() { me = this; }
    @Override protected void handleOnResume() { UsusTimerService.appVisible = true; }
    @Override protected void handleOnPause() { UsusTimerService.appVisible = false; }

    static void fire(String a, long at) {
        if (me == null) return;
        JSObject d = new JSObject(); d.put("a", a); d.put("at", at);
        me.notifyListeners("action", d, true);
    }

    @PluginMethod
    public void show(PluginCall call) {
        UsusTimerService.St s = new UsusTimerService.St();
        s.title = call.getString("title", "Usus"); s.text = call.getString("text", "");
        s.endTitle = call.getString("endTitle", ""); s.endText = call.getString("endText", "");
        s.start = (long) (double) call.getDouble("start", 0d); s.end = (long) (double) call.getDouble("end", 0d); s.rem = (long) (double) call.getDouble("rem", 0d);
        s.paused = call.getBoolean("paused", false); s.actions = call.getBoolean("actions", false);
        s.lPause = call.getString("lPause", s.lPause); s.lResume = call.getString("lResume", s.lResume); s.lSkip = call.getString("lSkip", s.lSkip); s.lPaused = call.getString("lPaused", s.lPaused);
        s.sound = call.getBoolean("sound", true); s.vib = call.getBoolean("vib", true);
        try { UsusTimerService.apply(getContext(), s); call.resolve(); }
        catch (Exception e) { call.reject(e.getMessage()); }   // p. ej. Android no deja empezar el servicio desde segundo plano
    }

    @PluginMethod
    public void hide(PluginCall call) { UsusTimerService.stop(getContext()); call.resolve(); }

    /** Permiso de notificaciones (Android 13+); antes no hace falta */
    @PluginMethod
    public void ask(PluginCall call) {
        if (Build.VERSION.SDK_INT < 33 || getPermissionState("notifications") == PermissionState.GRANTED) { ok(call, true); return; }
        requestPermissionForAlias("notifications", call, "asked");
    }
    @PermissionCallback
    private void asked(PluginCall call) { ok(call, getPermissionState("notifications") == PermissionState.GRANTED); }
    private void ok(PluginCall call, boolean g) { JSObject r = new JSObject(); r.put("granted", g); call.resolve(r); }
}
