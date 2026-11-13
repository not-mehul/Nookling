package io.github.notmehul.nookling;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.util.Base64;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;

/**
 * The page tells the widget what to show (src/platform/widget.ts): the pet's
 * name, a line about it, and a small PNG of it as it looks right now. Kept
 * in the app's private files and SharedPreferences; nothing leaves the phone.
 */
@CapacitorPlugin(name = "NooklingWidget")
public class WidgetPlugin extends Plugin {
    static final String PREFS = "nookling.widget";
    static final String PICTURE = "widget-pet.png";

    @PluginMethod
    public void update(PluginCall call) {
        Context context = getContext();
        String name = call.getString("name", "");
        String line = call.getString("line", "");
        String png = call.getString("png");
        if (png != null && !png.isEmpty()) {
            try (FileOutputStream out = new FileOutputStream(new File(context.getFilesDir(), PICTURE))) {
                out.write(Base64.decode(png, Base64.DEFAULT));
            } catch (IOException | IllegalArgumentException e) {
                // The widget keeps its last picture.
            }
        }
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString("name", name).putString("line", line).apply();
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        int[] ids = manager.getAppWidgetIds(new ComponentName(context, NooklingWidget.class));
        for (int id : ids) NooklingWidget.draw(context, manager, id);
        JSObject result = new JSObject();
        result.put("widgets", ids.length);
        call.resolve(result);
    }
}
