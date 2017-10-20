const Updater = require("electron-updater").autoUpdater,
  log = require("electron-log"),
  isDev = require("electron-is-dev");

/*
 * This is the controller class for the application updater. Linux distributions
 * should use the built in package manager for update? Maybe not.. need testing.
 */
module.exports = class AppUpdater {
  /*
   * called to initialize the updater
   */
  static init() {
    log.info("[AppUpdater] Initialize");

    // disable updates for linux and dev mode
    if (isDev || process.platform === "linux") return;

    Updater.autoDownload = false;

    Updater.on("checking-for-update", () => {
      log.info("Checking for update...");
    });
    Updater.on("update-available", info => {
      log.info("Update available.");
    });
    Updater.on("update-not-available", info => {
      log.info("Update not available.");
    });
    Updater.on("error", err => {
      log.error("Error in auto-updater.");
    });
    Updater.on("download-progress", progressObj => {
      let logMsg = "Download speed: " + progressObj.bytesPerSecond;
      logMsg = logMsg + " - Downloaded " + progressObj.percent + "%";
      logMsg =
        logMsg + " (" + progressObj.transferred + "/" + progressObj.total + ")";
      log.info(logMsg);
    });
    Updater.on("update-downloaded", info => {
      log.info("Update downloaded");
    });
  }

  /*
   * setup auto-update and check for updates. Called from createWindow()
   * see -> https://electron.atom.io/docs/all/#apprelaunchoptions
   */
  static startUpdate() {
    if (isDev || process.platform === "linux") return;
    Updater.checkForUpdates();
  }
};