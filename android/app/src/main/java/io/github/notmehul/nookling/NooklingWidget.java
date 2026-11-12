package io.github.notmehul.nookling;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.widget.RemoteViews;
import java.io.File;

/**
 * The home-screen widget: the pet as it looked when you last left the app,
 * its name and a line about it. A tap opens the app. It never runs anything
 * in the background; the page refreshes it each time the app is put away.
 */
public class NooklingWidget extends AppWidgetProvider {
    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        for (int id : ids) draw(context, manager, id);
    }

    static void draw(Context context, AppWidgetManager manager, int id) {
        SharedPreferences prefs = context.getSharedPreferences(WidgetPlugin.PREFS, Context.MODE_PRIVATE);
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_nookling);
        String name = prefs.getString("name", "");
        views.setTextViewText(R.id.widget_name, name.isEmpty() ? context.getString(R.string.app_name) : name);
        views.setTextViewText(R.id.widget_line, prefs.getString("line", context.getString(R.string.widget_empty)));
        File picture = new File(context.getFilesDir(), WidgetPlugin.PICTURE);
        Bitmap bitmap = picture.exists() ? BitmapFactory.decodeFile(picture.getAbsolutePath()) : null;
        if (bitmap != null) views.setImageViewBitmap(R.id.widget_pet, bitmap);
        else views.setImageViewResource(R.id.widget_pet, R.mipmap.ic_launcher_foreground);
        Intent open = new Intent(context, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent tap = PendingIntent.getActivity(context, 0, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.widget_root, tap);
        manager.updateAppWidget(id, views);
    }
}
