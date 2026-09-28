# Veracross Grade Estimator

A Chrome extension that estimates your grade in a Veracross class from the scored assignments on the page. Click the extension icon on a class's assignments page to see your estimate.

This is NOT affiliated with Veracross or any school.

## Install

This extension isn't on the Chrome Web Store, so it's installed as an unpacked extension.

1. On this GitHub page, click **Code**, then **Download ZIP**.
2. Unzip it. To do this on Windows, right-click the file and choose **Extract All**. (As per usual, Windows is stupid, so for mac users this is much easier, just choose the extracted file that appears after you unzip the original)
3. Open `chrome://extensions` in Chrome.
4. Turn on **Developer mode** in the top-right corner.
5. Click **Load unpacked** and select the folder that has `manifest.json` directly inside it.
6. (optional) Pin the extension: click the puzzle-piece icon in the toolbar, then the pin next to Veracross Grade Estimator.

Keep the folder after installing. Chrome loads the extension from it every time, so deleting or moving it removes the extension.

If Chrome says the manifest file is unreadable or missing, you selected a folder one level too high. Open the folder you picked; if it contains another folder instead of `manifest.json`, select that inner folder.

## Use

1. In Veracross, open a class and choose **View All Assignments**.
2. Click the extension's icon in the toolbar.

To keep the estimate visible while you scroll, turn on **Also show on the page** in the popup.

If the pop-up asks you to reload the page, the tab was open before you installed or updated the extension. Reload it once.

## How the estimate works

It adds up the points earned and points possible on every assignment that has a score, then divides. Pending and ungraded assignments are skipped.

It does not apply category weights. If your teacher weights tests more heavily than homework, your official grade can differ from this estimate, sometimes by several points. Treat it as a quick check, not your real grade.

## Privacy

Everything runs in your browser. The extension makes no network requests and sends your grades nowhere. It only runs on `veracross.com` and `myveracross.com` pages. The only thing it stores is whether the on-page display is turned on.

## Update

For updates, download the new version, replace the old folder's contents, then click the reload icon on the extension's card in `chrome://extensions`.