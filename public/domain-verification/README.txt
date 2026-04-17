אימות בעלות על דומיין (Google Search Console ואחרים)
====================================================

1) אימות דרך מטא־תג (מומלץ ב-Vercel)
   - ב-Google Search Console: בחר "HTML tag" והעתק את ערך content של meta google-site-verification.
   - ב-Vercel → Environment Variables הוסף:
     SITE_VERIFICATION_GOOGLE="<הערך בלבד>"
     או GOOGLE_SITE_VERIFICATION (תואם).
   - פרוס מחדש. Next.js יזריק את התג דרך lib/site-metadata.ts.

2) אימות Bing Webmaster Tools
   - הוסף SITE_VERIFICATION_BING="<ערך msvalidate.01>"

3) אימות דרך קובץ HTML (חלופה)
   - הורד מהקונסול קובץ כמו googleXXXXXXXX.html והנח כאן:
     public/googleXXXXXXXX.html
   - ודא שהקובץ נגיש ב-https://<הדומיין>/googleXXXXXXXX.html

4) אל תעלה קבצי אימות עם סודות ל-git אם הם חד-פעמיים — עדיף משתני סביבה.
