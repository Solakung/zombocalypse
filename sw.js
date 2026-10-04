// เซอร์วิสเวิร์กเกอร์แบบ "ไม่แคชอะไรเลย": มีไว้ให้ติดตั้งเป็นแอปได้ และให้ Android แสดงการแจ้งเตือนได้
// เนื้อหาเกมโหลดจากเน็ตตามปกติทุกครั้ง จึงไม่ขัดกับระบบเช็กเวอร์ชันของเกม (แบนเนอร์แจ้งอัปเดต)
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => { /* ปล่อยให้เบราว์เซอร์จัดการเอง */ });
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((cs) => (cs.length ? cs[0].focus() : self.clients.openWindow("./"))));
});
