package io.github.oluengo.usus;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.SystemClock;

import androidx.core.app.NotificationCompat;
import androidx.core.app.ServiceCompat;

/**
 * Notificación fija mientras hay una sesión en marcha (servicio en primer plano, como un temporizador):
 * la cuenta atrás del descanso o de la serie la lleva Android, así que sigue y avisa aunque Usus esté en
 * segundo plano o con la pantalla apagada. La web (JS) manda el estado con UsusTimerPlugin.show().
 * Botones: Pausa/Seguir y Saltar, que se pasan a la web.
 */
public class UsusTimerService extends Service {
    static final String CH_RUN = "usus_run", CH_SV = "usus_end_sv", CH_V = "usus_end_v";
    static final int ID = 7401, ID_END = 7402;
    static final String A_PAUSE = "io.github.oluengo.usus.PAUSE", A_SKIP = "io.github.oluengo.usus.SKIP";

    /** Estado que manda la web */
    static class St {
        String title = "Usus", text = "", endTitle = "", endText = "", lPause = "Pause", lResume = "Resume", lSkip = "Skip", lPaused = "Paused";
        long start = 0, end = 0, rem = 0;   // start: cronómetro hacia arriba (sesión); end: cuenta atrás; rem: en pausa
        boolean paused = false, actions = false, sound = true, vib = true;
    }
    static St st = new St();
    static UsusTimerService inst;
    static boolean appVisible = true;

    private final Handler h = new Handler(Looper.getMainLooper());
    private final Runnable onEnd = this::ended;
    private boolean done = false;

    static void apply(Context ctx, St s) {
        st = s;
        if (inst != null) { inst.refresh(); return; }
        Intent i = new Intent(ctx, UsusTimerService.class);
        if (Build.VERSION.SDK_INT >= 26) ctx.startForegroundService(i); else ctx.startService(i);
    }
    static void stop(Context ctx) {
        ctx.stopService(new Intent(ctx, UsusTimerService.class));
        ((NotificationManager) ctx.getSystemService(NOTIFICATION_SERVICE)).cancel(ID_END);
    }

    @Override public void onCreate() {
        super.onCreate(); inst = this; channels();
    }
    @Override public int onStartCommand(Intent intent, int flags, int startId) {
        String a = intent != null ? intent.getAction() : null;
        if (A_PAUSE.equals(a)) {                                   // en pausa ya, en la notificación; la web hace lo mismo
            long now = System.currentTimeMillis();
            if (!st.paused && st.end > 0) { st.rem = Math.max(0, st.end - now); st.paused = true; }
            else if (st.paused) { st.end = now + st.rem; st.paused = false; }
            UsusTimerPlugin.fire("pause", now);
        } else if (A_SKIP.equals(a)) UsusTimerPlugin.fire("skip", System.currentTimeMillis());
        Notification n = build();
        if (Build.VERSION.SDK_INT >= 34) ServiceCompat.startForeground(this, ID, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);
        else startForeground(ID, n);
        schedule();
        return START_NOT_STICKY;
    }
    @Override public void onDestroy() { h.removeCallbacks(onEnd); inst = null; super.onDestroy(); }
    @Override public IBinder onBind(Intent intent) { return null; }

    void refresh() {
        ((NotificationManager) getSystemService(NOTIFICATION_SERVICE)).cancel(ID_END);
        ((NotificationManager) getSystemService(NOTIFICATION_SERVICE)).notify(ID, build());
        schedule();
    }
    private void schedule() {
        h.removeCallbacks(onEnd); done = false;
        if (st.end > 0 && !st.paused) h.postAtTime(onEnd, SystemClock.uptimeMillis() + Math.max(0, st.end - System.currentTimeMillis()));
    }
    /** Fin de la cuenta atrás: la notificación lo dice y, si Usus no está a la vista, avisa con sonido o vibración */
    private void ended() {
        done = true;
        NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        nm.notify(ID, build());
        if (appVisible || (!st.sound && !st.vib)) return;
        NotificationCompat.Builder b = new NotificationCompat.Builder(this, st.sound ? CH_SV : CH_V)
            .setSmallIcon(R.drawable.ic_stat_usus).setContentTitle(st.endTitle).setContentText(st.endText)
            .setPriority(NotificationCompat.PRIORITY_HIGH).setCategory(NotificationCompat.CATEGORY_ALARM)
            .setAutoCancel(true).setTimeoutAfter(90000).setContentIntent(open());
        nm.notify(ID_END, b.build());
    }
    private PendingIntent open() {
        Intent i = getPackageManager().getLaunchIntentForPackage(getPackageName());
        if (i != null) i.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
        return PendingIntent.getActivity(this, 0, i, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    }
    private PendingIntent act(String a, int code) {
        return PendingIntent.getService(this, code, new Intent(this, UsusTimerService.class).setAction(a), PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    }
    private Notification build() {
        NotificationCompat.Builder b = new NotificationCompat.Builder(this, CH_RUN)
            .setSmallIcon(R.drawable.ic_stat_usus).setOngoing(true).setOnlyAlertOnce(true).setSilent(true)
            .setCategory(NotificationCompat.CATEGORY_STOPWATCH).setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setContentIntent(open());
        if (Build.VERSION.SDK_INT >= 31) b.setForegroundServiceBehavior(NotificationCompat.FOREGROUND_SERVICE_IMMEDIATE);
        if (done) {
            b.setContentTitle(st.endTitle).setContentText(st.endText);
        } else if (st.end > 0) {
            b.setContentTitle(st.title).setContentText(st.text);
            if (st.paused) b.setSubText(fmt(st.rem) + " · " + st.lPaused);
            else b.setUsesChronometer(true).setChronometerCountDown(true).setWhen(st.end).setShowWhen(true);
            if (st.actions) {
                b.addAction(0, st.paused ? st.lResume : st.lPause, act(A_PAUSE, 1));
                b.addAction(0, st.lSkip, act(A_SKIP, 2));
            }
        } else {
            b.setContentTitle(st.title).setContentText(st.text);
            if (st.start > 0) b.setUsesChronometer(true).setWhen(st.start).setShowWhen(true);
        }
        return b.build();
    }
    private static String fmt(long ms) {
        long s = (ms + 999) / 1000; return s >= 60 ? (s / 60) + ":" + String.format("%02d", s % 60) : String.valueOf(s);
    }
    private void channels() {
        if (Build.VERSION.SDK_INT < 26) return;
        NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        NotificationChannel run = new NotificationChannel(CH_RUN, getString(R.string.tmr_ch_run), NotificationManager.IMPORTANCE_LOW);
        run.setShowBadge(false); nm.createNotificationChannel(run);
        AudioAttributes aa = new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ALARM).setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build();
        long[] pat = { 0, 300, 120, 300 };
        NotificationChannel sv = new NotificationChannel(CH_SV, getString(R.string.tmr_ch_sv), NotificationManager.IMPORTANCE_HIGH);
        sv.setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION), aa); sv.enableVibration(true); sv.setVibrationPattern(pat);
        NotificationChannel v = new NotificationChannel(CH_V, getString(R.string.tmr_ch_v), NotificationManager.IMPORTANCE_HIGH);
        v.setSound(null, null); v.enableVibration(true); v.setVibrationPattern(pat);
        nm.createNotificationChannel(sv); nm.createNotificationChannel(v);
    }
}
