package io.github.oluengo.usus;

import android.content.Context;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.webkit.WebView;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Imprimir / guardar en PDF la vista actual (el imprimible de la rutina) con el servicio de impresión de Android. Sin permisos. */
@CapacitorPlugin(name = "UsusPrint")
public class UsusPrintPlugin extends Plugin {
    @PluginMethod
    public void print(PluginCall call) {
        final String name = call.getString("name", "Usus");
        getActivity().runOnUiThread(() -> {
            try {
                WebView wv = getBridge().getWebView();
                PrintManager pm = (PrintManager) getActivity().getSystemService(Context.PRINT_SERVICE);
                PrintDocumentAdapter ad = wv.createPrintDocumentAdapter(name);
                pm.print(name, ad, new PrintAttributes.Builder().setMediaSize(PrintAttributes.MediaSize.ISO_A4).build());
                call.resolve();
            } catch (Exception e) {
                call.reject(String.valueOf(e.getMessage()));
            }
        });
    }
}
