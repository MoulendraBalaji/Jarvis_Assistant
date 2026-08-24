import { NativeEventEmitter, NativeModules } from "react-native";

const { NotifListener } = NativeModules;
const emitter = new NativeEventEmitter(NotifListener);

export const notifListener = {
  start() {
    NotifListener?.startListener();
  },
  onNotification(cb: (n: { packageName: string; title: string; text: string }) => void) {
    return emitter.addListener("onNotification", cb);
  }
};
