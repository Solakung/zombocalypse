# แผนที่ script.js (สร้างอัตโนมัติด้วย `node tools/scriptmap.js` — รันใหม่ทุกครั้งที่เพิ่มหัวข้อ)

วิธีใช้: ดูหัวข้อที่เกี่ยวข้องแล้วตัดส่งให้ผู้ช่วยด้วย `node tools/scriptmap.js slice <เลขหัวข้อ>` หรือ `node tools/scriptmap.js lines <เริ่ม> <จบ>`

| หัวข้อ | บรรทัด | ชื่อ | ฟังก์ชัน/ค่าคงที่หลัก |
|---|---|---|---|
| — | 1–12 | ส่วนหัว: import, ตัวห่อเรียกฟังก์ชัน (`xxxCall`), ตารางไอเทม `ITEMS`, โซน `ZONES`, บอส `BOSSES`, สูตรคราฟต์ `RECIPES` | |
| 1 | 13–91 | ตั้งค่า Firebase | `baseCall` `marketCall` `passCall` `eventCall` `dailyCall` `campCall` `worldCall` |
| 2 | 92–514 | ข้อมูลเกม (โซน + ไอเทม) | `STAMINA_COST` `FOOD_DECAY_MS` `DEATH_KEEP` `DEATH_COOLDOWN` `DEATH_STACK` `STARVE_HP` `BOSS_COOLDOWN` |
| 3 | 515–635 | State + Helpers | `serverNow` `d6` `isStaff` `baseStat` `buffEnd` `buffActive` `buffOf` |
| 4 | 636–934 | หน้าโปรไฟล์ & เรนเดอร์หลอดพลัง | `showBio` `fmtDur` `guideExtra` `openGuide` `effectTick` `renderBuffRow` `clampToMax` |
| 5 | 935–1000 | ล็อกอิน & สมัครสมาชิก | `EMAIL_DOMAIN` `nameKey` `cleanName` `emailFor` `setMode` |
| 5.1 | 1001–1097 | ตัวแจกแต้มสเตตัส (ใช้ทั้งตอนสมัครและตอนผู้เล่นเก่าแจกครั้งแรก) | `buildStatPicker` `openStatModal` `START_KIT` `register` |
| 6 | 1098–1177 | เริ่มเกม | `HEARTBEAT_MS` `beat` `resumeOffline` `startGame` |
| 7 | 1178–1475 | โซน + แชท (อัปเดตระบบ Bubble) | `teardownZone` `travelCost` `travelCooldownLeft` `presenceSet` `presenceWatch` `enterZone` `logLine` |
| 8 | 1476–1486 | ประกาศระบบ | `listenAnnouncements` |
| 9 | 1487–1879 | กระเป๋า การกินอาหาร และ การทิ้งของ | `listenInventory` `renderInv` `renderCraft` `craft` `repairWeapon` `ARMOR_SALV` `armorYield` |
| 10 | 1880–2064 | ค้นหาไอเทม (ระบบหิวข้าว/หิวน้ำ) | `rollDrop` `processDeath` `scavengeOnce` `zombieEncounter` |
| 10.5 | 2065–2689 | มินิบอสประจำโซน (สู้เป็นรอบ: โจมตี / ใช้ยา / หนี) | `bossCooldownLeft` `bossLog` `startBoss` `listenBoss` `renderBoss` `bossStrike` `SKILLS` |
| 11 | 2690–2893 | ต่อสู้ (หักความหิว และแก้ไขแชทต่อสู้) | `myDmg` `attackDmg` `attackCooldownLeft` `updateAttackButtons` `attack` `watchAttack` `freeHit` |
| 12 | 2894–3340 | Admin Console | `fillSelect` `buildStatInputs` `buildAdmin` `readAdminItem` `spawnSkill` `SKILL_TYPES` `SKILL_FIELDS` |
| 13 | 3341–3408 | เครื่องมือ GM: ปิดแชทผู้เล่น / ล้างแชทโซน / ลบทีละข้อความ | `listenMyMute` `watchMutes` `unmute` |
| 14 | 3409–3521 | เหตุการณ์ประจำโซน (สุ่มอัตโนมัติ + แอดมินกำหนดเอง) | `AUTO_EVENT_WEIGHTS` `renderZoneTags` `renderAdminEvents` `refreshDanger` `listenEvents` `tickEvents` `maybeStartAutoEvent` |
| 12 | 3522–3692 | กระดานภารกิจ (GM โพสต์ → ผู้เล่นรับ/ส่งมอบ → GM ตรวจรับและมอบรางวัล) | `NEED_ITEMS` `rewardText` `needText` `listenQuests` `renderQuests` `questAccept` `questDeliver` |
| 13 | 3693–3756 | ติดเชื้อ (มนุษย์ที่ถูกซอมบี้ผู้เล่นกัดโดน) | `INFECT_TICK` `infectionTick` `syncInfectedFlag` `adminInfect` `adminRevive` |
| 14 | 3757–3970 | วิวัฒนาการซอมบี้ (DNA) — แปะต่อท้าย script.js | `EVO_STEP` `EVO_DAY` `EVO_LINES` `evoToday` `evoT` `evoBonusAt` `evoBonus` |
| 15 | 3971–4162 | ตลาดซื้อขาย — แปะต่อท้าย script.js (แยกตลาดตามฝั่ง: market/{human/zombie}) | `MKT_IDS` `MKT_SLOTS` `mktIdsFor` `mktHave` `MKT_WEAP` `mktWeaponSlots` `mktLabel` |
| 16 | 4163–4250 | ตลาดมืด — ระบบสุ่มของมาขาย หมุนรอบทุก 60 นาที (แปะต่อท้าย script.js ต่อจากข้อ 15 ตลาดซื้อขาย) | `BM_CFG` `bmWindow` `bmRng` `listenBlackMarket` `bmSubscribe` `bmRefresh` `bmMaybeRotate` |
| 17 | 4251–4490 | ตู้กาชา — หมุนด้วยทรัพยากร ได้ของเอาชีวิตรอด (แยกกองมนุษย์/ซอมบี้) | `GACHA_COST` `GACHA_ITEMS` `GACHA_QTY_MAX` `GACHA_SEED` `gachaKey` `gachaIsPerm` `listenGacha` |
| 18 | 4491–4674 | ภารกิจรายวัน / รายสัปดาห์ / ผู้เล่นใหม่ | `QP_PERIODS` `QP_EVENTS` `QP_GAP_MS` `QP_TZ_MS` `QP_SEED` `qpDayKey` `qpKey` |
| 19 | 4675–4903 | กำแพง Safe Zone • สภาพโซนรายวัน • ค้นลึก | `SMASH_EVERY` `wallWk` `SMASH_DMG` `WALL_MAX` `wallHp` `wallBroken` `wallDmod` |
| 20 | 4904–5032 | ชุดสวมใส่ (มนุษย์) • อวัยวะกลายพันธุ์ (ซอมบี้) • เควสรายวันผูกโซน | `GEAR_CUSTOM_MAX` `GEAR_SLOTS` `GEAR_FX` `GEAR_DROPS` `MUT_DROPS` `NEW_GEAR_DROPS` `NEW_MUT_DROPS` |
| 21 | 5033–5055 | เกราะสุ่มรางวัลบอสโลก (คลังต่อผู้ร่วมโจมตี + ชิ้นพิเศษอันดับ 1) | `LOOT_RED` `LOOT_PRE` `LOOT_TOP` `LOOT_ARM` `LOOT_ACC` `lootTierOf` `lootPick` |
| 22 | 5056–5306 | บรรยากาศ • สมุดบันทึก • สรุปวัน/สัปดาห์ • อันดับ • คำเตือน • เสียง | `HAS_DOM` `AMB_CHANCE` `lsKey` `dayKey` `weekStartKey` `stat` `statSum` |
| 23 | 5307–5800 | แผนที่โซน • ติดตั้งเป็นแอป (PWA) • แจ้งเตือนเมื่อพร้อม • ตั้งค่า • ไอเทมโปรด (hotbar) | `ZMAP` `ZROADS` `zmapOn` `zmapRoads` `buildZoneList` `zmapApply` `zmapListen` |
| 51 | 5801–5921 | 📡 ภารกิจ HC — ตามหานักวิจัยที่ศูนย์วิจัยร้าง (ธารา) + ส่งชิ้นส่วน DNA | `HC_ID` `hcOn` `hcM` `hcBossDone` `hcFound` `hcReady` `hcGoal` |
| 26 | 5922–6125 | วิทยุฉุกเฉิน | `RADIO_SLOT` `rdHash` `rdPick` `rdFill` `RD_AMBIENT` `RD_TIPS` `RD_BOSS` |
| 27 | 6126–6178 | คืนปิดล้อม (ทุกวัน 30 นาที ช่วงหัวค่ำ — เวลาเริ่มสุ่มจากวัน ทุกเครื่องตรงกัน) | `SIEGE_DUR` `siegeSched` `siegeNext` `siegeLive` `siegeClock` `siegeHit` `SG_PRE` |
| 28 | 6179–6240 | เอฟเฟกต์หน้าตา (ฝั่ง client ล้วน — ไม่เขียนข้อมูลใดขึ้นเซิร์ฟเวอร์) | `fxOff` `fxLayer` `fxVig` `fxNum` `fxDie` `fxSparks` `fxOnLog` |
| 29 | 6241–6721 | ความสำเร็จ • ฉายา • ยอดร่วมทั้งเซิร์ฟเวอร์ (เป้าหมายประจำสัปดาห์ / ภารกิจกลุ่มจากวิทยุ / ผู้รอดเด่นประจำวัน) | `ACH_GAP` `ACH_TIER` `ACH_CATS` `ZSHORT` `ACH_FAM` `ACH_HARD` `ACH` |
| 30 | 6722–6793 | ข่าววิทยุจากผู้เล่น (feed) + 🏆 หอเกียรติยศ | `FEED_GAP` `feedPost` `feedDrain` `feedText` `feedListen` `FAME` `fameLoad` |
| 31 | 6794–6903 | 💰 ค่าหัว (bounty)  +  ⚡ เหตุการณ์ใหญ่ทั้งเซิร์ฟเวอร์ | `BTY_LIFE` `bountyActive` `bountyOn` `bountyPlace` `bountyKillWrite` `bountyListen` `bountyWorldRows` |
| 35 | 6904–7078 | 🌦️ สภาพอากาศ + 🔊 เสียงดึงซอมบี้ + ข้อความบรรยายสมจริง | `WX_BLOCK` `WX_TIP` `wxBase` `wxAt` `wxForced` `wxNow` `wxScale` |
| 36 | 7079–7396 | 🎆 เทศกาลตามปฏิทิน • 🛩️ คลังลับ • 🤝 ภารกิจเคียงข้าง • 🧭 เส้นทางอาชีพ • ⭐ ตลาด "ของที่ตามหา" | `FXM` `fxGet` `fxSet` `FX_MOON_REF` `fxMoonAge` `fxMoon` `fxDate` |
| 37 | 7397–7559 | 🏕️ โปรเจกต์ค่าย/รัง • ⚔️ ศึกชิงโซน — ใช้ตัวนับกลุ่ม coop/ เดิม (ไม่ต้องแก้ rules) | `PROJ_ITEMS` `PROJ` `projSeason` `projKey` `projCost` `projSum` `projDone` |
| 38 | 7560–7713 | 🏠 ที่พัก — สถานีตั้งเวลาในค่าย (เขียนข้อมูลผ่าน Cloud Function baseAct — functions/base.js — rules ปิดการเขีย | `BASE_P` `BASE_UP` `baseKind` `baseLv` `baseSlots` `baseUpItem` `baseOn` |
| 39 | 7714–7912 | 📅 สรุปจบวัน • 🍂 ฤดูกาล 28 วัน • 📖 สมุดสะสม • 🤝 พรจากมิตรภาพ NPC — ไม่ต้องแก้ rules | `SEA_LEN` `SEA` `seaDay` `seaIdx` `seaDayIn` `seaDef` `seaOn` |
| 40 | 7913–8020 | 🛠️ โต๊ะงานตั้งเวลา • 🪟 ของตกแต่งที่พัก (ต้องใช้ rules v33: base/{uid}/j1,j2 และ base/{uid}/deco) | `BENCH` `DECO` `benchSlots` `benchLeft` `benchDone` `benchHave` `benchStart` |
| 41 | 8021–8125 | 🎮 มินิเกมตอนค้นลึก — 📻 รหัสวิทยุ / 🌲 เสียงในป่า (ฝั่ง client ล้วน ไม่ใช้ rules) | `MG_LEN` `MG_FOREST` `mgOn` `mgScore` `mgTier` `mgTable` `mgBeep` |
| 42 | 8126–8258 | 🏡 ภาพห้องที่พัก (SVG วาดจากข้อมูลจริง) — ฝั่ง client ล้วน | `SCN_POS` `SCN_PAL` `SCN_ZPAL` `scnHash` `scnSky` `baseSceneSvg` `baseSceneFill` |
| 43 | 8259–8433 | 🌍 เป้าหมายโลกประจำวัน • 📜 บันทึกประจำฤดูกาล • 🏅 ฉายาใกล้ปลดล็อก • 📖 สมุดสะสมซิงค์ข้ามเครื่อง (ฝั่ง client  | `BK_SP` `BK_PFX` `bkChunks` `bkDecode` `bookSync` `seaMedals` `wgOn` |
| 44 | 8434–8489 | 🎁 เยี่ยมบ้านเพื่อน + ฝากของ (ต้องใช้ rules v35) | `GIFT_IDS` `gftOn` `gftSend` `gftVisit` `gftBioRow` `gftSeen` |
| 45 | 8490–8611 | 🌳 ต้นไม้ทักษะสายอาชีพ — ไม่ต้องแก้ rules | `SK_KEY` `skOn` `skMask` `skHas` `skSpent` `skEarned` `skFree` |
| 46 | 8612–8706 | 🧭 ทีมสำรวจ — ส่งทีมออกนอกค่าย 4 ชั่วโมง กลับมารับของ (ต้องใช้ rules v36: exp/{uid}) | `EXP_MS` `EXP_ZONES` `EXP_H` `EXP_Z` `expOn` `expZom` `expReward` |
| 47 | 8707–8905 | 🎒 Release K — ปุ่มลัดบนแถบบน • 🧭 ภารกิจวันแรก • 🐾 สัตว์เลี้ยงประจำค่าย • 🎣 ตกปลา • 🍲 อาหารจากปลา (rules v | `ONB_STEPS` `onbOn` `onbCnt` `onbDone` `onbOk` `onbReady` `onbLeft` |
| 48 | 8906–9186 | 🧰 Release L — ระบบเสริมฝั่งเกมล้วน (ไม่แตะ rules) | `INV_CATS` `INV_ORDER` `invCat` `invList` `invGroupHdr` `invFiltering` `invToolsInit` |
| 49 | 9187–9335 | 🔥 Release M — เหตุผลให้กลับมา (ต้องใช้ rules v40) | `CK_MILES` `BACK_REW` `ckOn` `ckDay` `mRew` `ckUnclaimed` `ckToday` |
| 49.2 | 9336–9400 | 🧭 บทเรียนแนะนำการเล่น (Coach) — เส้นทาง 12 ขั้น แยกมนุษย์/ซอมบี้ (functions/learn.js — learnAct) • ไม่แตะ rul | `coachGoTo` `coachSync` `coachTick` `coachBar` `coachClaim` `coachOpen` `coachRender` |
| 49.3 | 9401–9570 | 🌱 แปลงปลูกในที่พัก (functions/garden.js — gardenAct) • ไม่แตะ rules | `SEED_LBL` `seedLbl` `SEASON_TH` `gardenGo` `CROP_ART` `gPlant` `gStage` |
| 49.35 | 9571–9615 | 📖 สมุดสะสมแบบชุด + 🏅 ความสมบูรณ์ผู้รอดชีวิต (functions/col.js — colAct) • แท็บ "สะสม" ในศูนย์กิจกรรม | `colDot` `colSync` `colKick` `colTick` `colRender` |
| 49.45 | 9616–9716 | 🛋️ บ้านของฉัน — จัดห้องเอง • ธีม • เยี่ยมห้อง • ถูกใจ • ห้องยอดนิยม (functions/home.js — homeAct) • ไม่แตะ ru | `homeItemsMap` `homePal` `homeGo` `homeLoad` `homeDraftInit` `homeUsed` `homeSceneObj` |
| 49.46 | 9717–9791 | ⚡ ความสามารถประจำอาชีพ/สายวิวัฒนาการ (functions/ability.js — abilAct) • ⚔️ ศึกใหญ่ประจำสัปดาห์ (functions/war. | `abilLive` `abilInvalidate` `fxAbilMods` `fxAbilCut` `abilDice` `abilSync` `warSync` |
| 49.47 | 9792–9910 | 🪪 โปรไฟล์ตกแต่งตัวตน — อวาตาร์ • กรอบ • แบนเนอร์ • ฉายา • รูปอัปโหลด (functions/profile.js — profAct • storag | `FR_CSS` `BN_CSS` `bnBg` `avBg` `profImgUrl` `profCardEl` `profGo` |
| 49.4 | 9911–9931 | 🎲 ศูนย์กิจกรรม — หน้าต่างเดียวรวม 🎟️ ซีซัน • 🎁 รายวัน • 🎲 ผจญภัย • 🔥 เช็กอิน | `HUB2_TABS` `hubOn` `hubTabDot` `hubDot` `hubBtn` `hubShow` |
| 49.48 | 9932–10043 | คาสิโนเถื่อน (functions/casino.js) — โซนสงบ: แลกของ/เลือดเป็นชิป เล่นเกมบ้าน กู้ยืม ร้านแลก | `CS_GAMES` `CS_BETS` `CS_RT` `CS_HOME` `csErr` `casinoBar` `casinoOpen` |
| 49.49 | 10044–10139 | โต๊ะสลาฟ (functions/slave.js) — ผู้เล่นหลายคนในคาสิโนเถื่อน | `SL_R` `slTxt` `slCombo` `slSt` `slStop` `slListen` `slTimerTick` |
| 49.5 | 10140–10255 | 🎟️ ภารกิจซีซัน (Season Pass) + 🎭 เหตุการณ์สุ่มแบบเลือกทาง | `fnErr` `passMs` `passDot` `passSync` `passTick` `passBtn` `passOpen` |
| 49.6 | 10256–10342 | 🎁 กิจกรรมประจำวัน — หีบรายวัน • ล่าค่าหัว • อีเวนต์โลกรายสัปดาห์ • ต้นไม้ค่าย/สัตว์เลี้ยง | `acs` `actSync` `actDot` `actBtn` `actTick` `actOpen` `actRefresh` |
| 49.7 | 10343–10471 | 🎲 ผจญภัย — 🕳️ ดิ่งลึก • 👹 ศัตรูคู่อาฆาต • 📻 ปริศนาวิทยุ • 🐪 ขบวนพ่อค้าเร่ | `adv` `advSync` `advDot` `advBtn` `advTick` `advOpen` `advRefresh` |
| 50 | 10472–10690 | 🎲 Release N — ท้าดวลระหว่างผู้เล่น (duel/, ds/, dc/ • ต้องใช้ rules v41) | `DUEL_ITEMS` `DUEL_G` `DUEL_RPS` `duelOn` `dCard` `dHandA` `dHandB` |
| 33 | 10691–10778 | 🪧 ป้ายประกาศประจำโซน (sign/{zone}/{uid}) + ⚡ เจ้าของสั่งอีเวนต์ทันที (evtForce/) | `SIGN_LIFE` `signBad` `signFresh` `signListen` `signRender` `signStyle` `evtForceListen` |
| 34 | 10779–10924 | 🧪 แคปซูลสเตตัส + 🔓 แกนทะลุขีดจำกัด (อัปสเตตัสถาวรจากไอเทม) | `STATUP_STEP` `statNat` `statBrkMax` `statBrkOf` `statCeil` `statCapCost` `statLimCost` |
| 32 | 10925–11109 | 🎛️ ปรับตัวเลขเกมสดๆ (tune/) + 📈 แดชบอร์ดเศรษฐกิจ (เจ้าของเท่านั้น) | `T` `gachaDay` `gachaToday` `gachaTodayAdd` `achApplyTune` `tuneListen` `tuneDefs` |
