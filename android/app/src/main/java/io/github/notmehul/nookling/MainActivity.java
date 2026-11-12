package io.github.notmehul.nookling;

import com.getcapacitor.BridgeActivity;

/**
 * Capacitor shell for Nookling. The whole app is the web page; nookling://
 * links arrive as VIEW intents (AndroidManifest.xml), which the App plugin
 * passes to the page (src/platform/incoming.ts). Reminders are scheduled
 * ahead of time by the Local Notifications plugin (src/platform/notify.ts),
 * so nothing runs in the background.
 */
public class MainActivity extends BridgeActivity {}
