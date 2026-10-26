package io.github.oluengo.usus;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(UsusPrintPlugin.class);
        registerPlugin(UsusSharePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
