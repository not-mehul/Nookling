package io.github.notmehul.nookling;

import static androidx.test.espresso.web.sugar.Web.onWebView;
import static androidx.test.espresso.web.webdriver.DriverAtoms.findElement;
import static androidx.test.espresso.web.webdriver.DriverAtoms.getText;
import static androidx.test.espresso.web.webdriver.DriverAtoms.webClick;
import static androidx.test.espresso.web.assertion.WebViewAssertions.webMatches;
import static org.hamcrest.Matchers.containsString;

import androidx.test.core.app.ActivityScenario;
import androidx.test.espresso.web.webdriver.Locator;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import org.junit.Test;
import org.junit.runner.RunWith;

/**
 * Drives the real app (WebView + native bridge) on a device or emulator:
 * the page loads, the tabs switch, and the app survives being recreated.
 */
@RunWith(AndroidJUnit4.class)
public class NooklingAppTest {

    private static final long TIMEOUT_MS = 30_000;

    @Test
    public void opensEveryTab() {
        try (ActivityScenario<MainActivity> scenario = ActivityScenario.launch(MainActivity.class)) {
            waitForText(Locator.ID, "tabSettings", "SETTINGS");
            onWebView().withElement(findElement(Locator.ID, "tabSettings")).perform(webClick());
            waitForText(Locator.CSS_SELECTOR, "#viewSettings h2", "Appearance");
            scenario.recreate();
            waitForText(Locator.ID, "tabNook", "NOOK");
        }
    }

    private static void waitForText(Locator locator, String value, String expected) {
        long until = System.currentTimeMillis() + TIMEOUT_MS;
        AssertionError last = null;
        while (System.currentTimeMillis() < until) {
            try {
                onWebView().withElement(findElement(locator, value)).check(webMatches(getText(), containsString(expected)));
                return;
            } catch (AssertionError | RuntimeException e) {
                last = e instanceof AssertionError ? (AssertionError) e : new AssertionError(e);
                try {
                    Thread.sleep(500);
                } catch (InterruptedException ignored) {
                    Thread.currentThread().interrupt();
                    return;
                }
            }
        }
        throw last != null ? last : new AssertionError("Timed out waiting for " + value);
    }
}
