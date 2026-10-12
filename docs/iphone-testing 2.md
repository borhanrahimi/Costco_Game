# iPhone testing in Xcode

The native wrapper uses Capacitor 8.5.3, Swift Package Manager, and the existing `www` game. App ID and name stay in `capacitor.config.json`. No development-server URL is configured: game assets ship in the app and do not require Wi-Fi. iOS 15 or later is the generated deployment target. Keep the default app icon/splash for local testing; these are placeholders.

Verified in this workspace: `npm test`, `npm run ios:sync`, and the unsigned iPhoneOS Debug build below all passed with Xcode 27.0. Xcode detected the connected physical iPhone. Signed installation and gameplay acceptance remain to be completed in Xcode.

## Install and run

```sh
npm ci
npm test
npm run ios:sync
npm run ios:open
```

1. Connect and unlock the iPhone. Accept Trust prompts on the Mac/phone.
2. In Xcode, wait for package resolution. Select the blue **App** project in the navigator, then the **App** target → **Signing & Capabilities**. Enable automatic signing and choose your Apple ID team. Add your Apple ID in Xcode Settings → Accounts if needed. Do not commit personal signing credentials.
3. Select your iPhone as the run destination. Enable Settings → Privacy & Security → Developer Mode on the phone if requested, following its restart prompts.
4. Press **Run** (⌘R). Complete any device trust/developer certificate prompts shown by iOS/Xcode. If Xcode requests an additional platform component, install the component it identifies.

After changing game files, run `npm run ios:sync`, then Run again. No bundle command is required for the native app.

## Acceptance checklist

- Clock in; drag to walk, release to stop, and walk through both entrance/exit doors.
- TALK with Borhan and Carlos. Advance all lines, inspect portraits and long text, then resume walking.
- ENTER the forklift; turn and reverse near shelves, counters, walls and employees. EXIT with clear space; confirm a blocked exit keeps Preston aboard. Test joystick and action button together.
- Check camera, performance, safe areas and controls in portrait and both landscape directions.
- Confirm sound starts after a tap. Background and resume: no stuck input.
- Close/relaunch while walking and driving: position, conversations, hot dogs and forklift state should persist. Safari saves are separate from the native app. Uninstalling the app clears its local data.
- Relaunch with Airplane Mode enabled: map, portraits and controls should still work.

## Build check without signing

```sh
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Debug -sdk iphoneos -destination 'generic/platform=iOS' -derivedDataPath /tmp/prestons-shift-ios-build CODE_SIGNING_ALLOWED=NO build
```

This checks compilation only. A signed device run and the manual checklist are still required; an unsigned build cannot be installed on your iPhone. No App Store upload is part of this setup.

Official workflow: https://capacitorjs.com/docs/ios
