package com.whattoeat.today;

import android.os.Bundle;

import androidx.core.view.WindowCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    // Avoid drawing web content under the status bar / display cutout on all devices.
    WindowCompat.setDecorFitsSystemWindows(getWindow(), true);
  }
}
