אימות דומיין — קבצים סטטיים (בנוסף למטא־תגיות מ־.env.local)
================================================================

1) Google Search Console — שיטת קובץ HTML
   - גוגל נותנים שם קובץ מדויק, למשל: google123abc.html
   - צור את הקובץ תחת: public/google123abc.html
   - תוכן הקובץ: מה שהממשק של גוגל מציג (שורה אחת עם google-site-verification)
   - אחרי deploy: ודא שזה נפתח ב-https://הדומיין-שלך/google123abc.html

2) Microsoft Bing — BingSiteAuth.xml
   - הורד מהממשק את BingSiteAuth.xml
   - העתק ל: public/BingSiteAuth.xml (שם קובץ בדיוק כפי שבינג דורשים)
   - ערוך את הקובץ: BingSiteAuth.xml.example כאן בתיקייה — זה רק תבנית

3) מטא־תגיות (מומלץ עם Vercel)
   - מלא ב-.env.local את SITE_VERIFICATION_GOOGLE וכו׳ — ראה .env.example
   - redeploy כדי שהטוקנים ייכנסו ל-layout

4) NEXT_PUBLIC_SITE_URL
   - בפרודקשן הגדר לכתובת הקנונית (למשל https://www.bsd-ybm.co.il)
   - משפיע על metadataBase ו-openGraph
