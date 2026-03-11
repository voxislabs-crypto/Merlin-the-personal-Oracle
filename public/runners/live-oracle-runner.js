addEventListener('syncSettings', (resolve, reject, args) => {
  try {
    CapacitorKV.set('merlin_live_settings', JSON.stringify(args || {}));
    resolve();
  } catch (error) {
    reject(error);
  }
});

addEventListener('cacheAdvice', (resolve, reject, args) => {
  try {
    CapacitorKV.set('merlin_live_advice', JSON.stringify(args || {}));
    resolve();
  } catch (error) {
    reject(error);
  }
});

addEventListener('liveOracleTick', (resolve, reject, args) => {
  try {
    const settingsRaw = CapacitorKV.get('merlin_live_settings')?.value || '{}';
    const adviceRaw = CapacitorKV.get('merlin_live_advice')?.value || '{}';

    const settings = JSON.parse(settingsRaw);
    const advice = JSON.parse(adviceRaw);

    if (settings.proactiveNotifications === false) {
      resolve();
      return;
    }

    const now = Date.now();
    const lastRunRaw = CapacitorKV.get('merlin_live_last_run')?.value || '0';
    const lastRun = Number(lastRunRaw) || 0;
    const intervalMinutes = Number(settings.intervalMinutes || 15);
    const minGap = Math.max(10, intervalMinutes) * 60 * 1000;

    if (now - lastRun < minGap) {
      resolve();
      return;
    }

    const position = CapacitorGeolocation.getCurrentPosition();

    const title = 'Merlin Live Oracle';
    const exact = advice.exact || 0;
    const approaching = advice.approaching || 0;
    const coords = position
      ? `${Number(position.latitude).toFixed(3)}, ${Number(position.longitude).toFixed(3)}`
      : 'unknown location';

    const fallbackBody = `At ${coords}: ${exact} exact / ${approaching} approaching transit contacts. Stay intentional.`;
    const body = (advice.advice || fallbackBody).slice(0, 180);

    CapacitorNotifications.schedule({
      notifications: [
        {
          id: now % 2147483647,
          title,
          body,
          scheduleAt: new Date(now + 1000),
          extra: {
            type: 'live-oracle-background',
            latitude: position?.latitude,
            longitude: position?.longitude,
          },
        },
      ],
    });

    CapacitorKV.set('merlin_live_last_run', String(now));
    resolve();
  } catch (error) {
    reject(error);
  }
});
