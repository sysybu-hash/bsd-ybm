type SectionConfig = {
  eyebrow: string;
  title: string;
  description: string;
  legacyHref: string;
  legacyLabel: string;
  stats: { label: string; value: string; tone?: "accent" | "success" | "neutral" }[];
  actions: { href: string; label: string; kind?: "primary" | "secondary" }[];
  flow: string[];
  primaryPanel: {
    title: string;
    body: string;
    items: string[];
  };
  secondaryPanel: {
    title: string;
    body: string;
    items: string[];
  };
  rightRailTitle: string;
  rightRailItems: string[];
};

export const appSectionConfigs: Record<string, SectionConfig> = {
  inbox: {
    eyebrow: "Inbox",
    title: "תיבת העבודה תציג רק מה שבאמת דורש טיפול עכשיו.",
    description: "במקום קפיצה בין מסכים והתראות, המשתמש מקבל חלון עבודה אחד שמסדר דחיפות, אישורים וחריגות לפי הקשר.",
    legacyHref: "/app/inbox/advanced",
    legacyLabel: "מרכז בקרה מתקדם",
    stats: [
      { label: "מיקוד", value: "דחוף קודם", tone: "accent" },
      { label: "הקשר", value: "לקוח + מסמך + חיוב", tone: "success" },
      { label: "תחושה", value: "פחות עומס", tone: "neutral" },
    ],
    actions: [
      { href: "/app/inbox/advanced", label: "לפתוח את מרכז הבקרה המתקדם" },
      { href: "/app", label: "חזרה לבית החדש", kind: "secondary" },
    ],
    flow: [
      "פותחים את המסך ורואים קודם את מה שחוסם עבודה או כסף.",
      "נכנסים לפריט אחד ומקבלים הקשר מלא בלי לחפש ידנית במקומות אחרים.",
      "מבצעים אישור, טיפול או דחייה וחוזרים מיד לרשימת הפעולה.",
    ],
    primaryPanel: {
      title: "מה אמור להופיע בחלון הזה",
      body: "המסך החדש יתמקד בפעולה הבאה ולא רק בהתראה עצמה.",
      items: [
        "אישורים פתוחים לפי דחיפות.",
        "מסמכים שלא שויכו או דורשים בדיקה.",
        "גבייה, משימות וחריגות שצריכות תשומת לב.",
      ],
    },
    secondaryPanel: {
      title: "שיפורי שימוש שאנחנו מכוונים אליהם",
      body: "החלון צריך להיות קריא תוך שניות גם בטלפון וגם בדסקטופ.",
      items: [
        "קבוצות ברורות: עכשיו, היום, בהמשך.",
        "פחות רעש ויזואלי ויותר פעולות ישירות.",
        "אותה שפה של כרטיסים, סטטוסים וכפתורים בכל המוצר.",
      ],
    },
    rightRailTitle: "עקרונות חוויית שימוש",
    rightRailItems: [
      "מסך שמתחיל מהשאלה מה דורש ממני פעולה, לא מאיזה מודול זה הגיע.",
      "כל פריט צריך לאפשר כניסה מהירה ויציאה נקייה חזרה לרשימה.",
      "אותו layout גם במובייל כדי שלא צריך ללמוד מחדש את המסך.",
    ],
  },
  clients: {
    eyebrow: "Clients",
    title: "אזור הלקוחות החדש בנוי סביב סקירה, pipeline ופרטי לקוח ברורים.",
    description: "במקום קובץ CRM כבד אחד, ה-v2 מחלקת את העבודה לחלונות פשוטים יותר להבנה ולתחזוקה.",
    legacyHref: "/app/clients/advanced",
    legacyLabel: "CRM מתקדם",
    stats: [
      { label: "סקירה", value: "overview ברור", tone: "accent" },
      { label: "עבודה", value: "pipeline + detail", tone: "success" },
      { label: "מטרה", value: "פחות עומס קוגניטיבי", tone: "neutral" },
    ],
    actions: [
      { href: "/app/clients/advanced", label: "לפתוח את ה-CRM המתקדם" },
      { href: "/app", label: "חזרה לבית החדש", kind: "secondary" },
    ],
    flow: [
      "מתחילים מסקירה של לקוחות, סטטוסים ומשימות פתוחות.",
      "נכנסים ללקוח או לשלב בצנרת במקום לעבוד על הכול במסך אחד ענק.",
      "מבצעים פעולה אחת ברורה: יצירת קשר, עדכון סטטוס, שיוך מסמך או פתיחת חיוב.",
    ],
    primaryPanel: {
      title: "החלונות שיהיו כאן",
      body: "העיצוב החדש מפרק את ה-CRM לחלונות ברורים שכל אחד עושה דבר אחד טוב.",
      items: [
        "Clients Overview להצגת תמונת מצב מהירה.",
        "Pipeline Board לניהול הזדמנויות והתקדמות.",
        "Client Detail לעבודה מרוכזת על לקוח יחיד.",
      ],
    },
    secondaryPanel: {
      title: "למה זה ידידותי יותר",
      body: "המשתמש לא צריך לסרוק מאות אזורים שונים כדי להבין איפה הוא נמצא.",
      items: [
        "כותרת ברורה עם פעולה ראשית אחת.",
        "מדדים למעלה, עבודה באמצע, הקשר בצד.",
        "מעבר עקבי לאותו סגנון גם במסמכים ובחיוב.",
      ],
    },
    rightRailTitle: "מיפוי מעבר",
    rightRailItems: [
      "המסך החדש יחליף בהדרגה את הקומפוננטה הגדולה של CRM.",
      "הנתיבים החדשים נשארים קרובים לשפה העסקית של המשתמש.",
      "המערכת ממשיכה לעבוד גם לפני שהפירוק הושלם.",
    ],
  },
  documents: {
    eyebrow: "Documents",
    title: "אזור המסמכים החדש יאפשר קליטה, שיוך ויצירה בלי בלבול.",
    description: "החלון הזה מתוכנן סביב מסמך כיחידת עבודה: מה נכנס, מה זוהה, מה חסר, ומה הצעד הבא.",
    legacyHref: "/app/documents/erp",
    legacyLabel: "מסמכים קיימים",
    stats: [
      { label: "תצוגה", value: "מסמך ראשון", tone: "accent" },
      { label: "עזרה", value: "AI בתוך המסמך", tone: "success" },
      { label: "זרימה", value: "קליטה → שיוך → פעולה", tone: "neutral" },
    ],
    actions: [
      { href: "/app/documents/erp", label: "לפתוח את משטח ה-ERP המלא" },
      { href: "/app", label: "חזרה לבית החדש", kind: "secondary" },
    ],
    flow: [
      "קולטים מסמך ורואים מיד מה הוא ומה מצב העיבוד שלו.",
      "בודקים הצעת שיוך ללקוח, לפרויקט או לחיוב בלי לצאת למסכים אחרים.",
      "מאשרים, מתקנים או מפיקים מסמך חדש מתוך אותו חלון עבודה.",
    ],
    primaryPanel: {
      title: "עקרונות לחלון מסמכים טוב",
      body: "המשתמש צריך להבין מצב מסמך תוך שניות ולא לחפש אותו בטבלאות שטוחות בלבד.",
      items: [
        "תצוגת preview ברורה של המסמך.",
        "שדות שנחולצו והמלצות AI במקום גלם טכני.",
        "פעולות ישירות: שיוך, אישור, הפקה, שליחה.",
      ],
    },
    secondaryPanel: {
      title: "מה משתפר לעומת היום",
      body: "ה-v2 מפחיתה ערבוב בין סוגי מסמכים ובין ממשקי back-office.",
      items: [
        "פחות צפיפות טבלאית, יותר התמקדות במסמך הנבחר.",
        "ניווט ברור בין incoming, issued ו-needs review.",
        "חיבור טבעי ללקוחות ולחיוב.",
      ],
    },
    rightRailTitle: "חוויית שימוש רצויה",
    rightRailItems: [
      "אותה שפה ויזואלית למסמך סרוק ולמסמך שהמערכת מייצרת.",
      "פחות modal-heavy workflow ויותר רצף עבודה קבוע.",
      "מסך שגם עובד טוב במובייל לבדיקות ואישורים מהירים.",
    ],
  },
  billing: {
    eyebrow: "Billing",
    title: "החלון הפיננסי החדש צריך להיות צפוי, רגוע וקל לקבל ממנו החלטות.",
    description: "ה-v2 מפרידה בין תמונת מצב פיננסית, מסמכי חיוב, גבייה ודיווח, כדי שהמשתמש יבין מהר מה קורה בכסף.",
    legacyHref: "/app/documents/erp",
    legacyLabel: "ERP קיים",
    stats: [
      { label: "סדר", value: "בית פיננסי אחד", tone: "accent" },
      { label: "בהירות", value: "פחות דחיסות", tone: "success" },
      { label: "מיקוד", value: "גבייה ותזרים", tone: "neutral" },
    ],
    actions: [
      { href: "/app/documents/erp", label: "לפתוח את משטח ה-ERP המלא" },
      { href: "/app", label: "חזרה לבית החדש", kind: "secondary" },
    ],
    flow: [
      "מתחילים מתמונת מצב: פתוח, נגבה, ממתין או חריג.",
      "נכנסים לתת-אזור כמו חשבוניות, גבייה או דיווח במקום למסך עמוס אחד.",
      "מבצעים פעולה ברורה: הפקה, שליחה, מעקב, או תיקון.",
    ],
    primaryPanel: {
      title: "החלונות המרכזיים כאן",
      body: "הפרדה ברורה בין סוגי עבודה פיננסיים עושה את המסך קל לתפעול.",
      items: [
        "Billing Home למדדים ותשומת לב.",
        "Invoices & Documents למסמכי חיוב.",
        "Collections & Reporting למעקב, גבייה ודוחות.",
      ],
    },
    secondaryPanel: {
      title: "מה חשוב בחוויית משתמש פיננסית",
      body: "מסך כספי טוב חייב להרגיש יציב, צפוי ואמין, לא ניסיוני.",
      items: [
        "כפתורי פעולה במקומות קבועים.",
        "צבעים שמבדילים סטטוס בלי עומס דרמטי.",
        "מידע כספי גדול וברור עם הקשר סביבו.",
      ],
    },
    rightRailTitle: "עקרונות למסך ידידותי",
    rightRailItems: [
      "המשתמש חייב להבין תוך רגע אם יש בעיית גבייה או רק עומס מידע.",
      "אותו מבנה של summary, עבודה, context בכל עמוד פיננסי.",
      "צמצום קפיצות בין ERP, invoices ו-admin למסלול פעולה אחד.",
    ],
  },
  operations: {
    eyebrow: "Operations",
    title: "אזור התפעול ירכז workflows, משימות וכלי צוות בלי כאוס.",
    description: "במקום כמה אזורים חופפים, ה-v2 תארגן את התפעול לפי תרחישי עבודה אמיתיים של הצוות.",
    legacyHref: "/app/operations/advanced",
    legacyLabel: "Meckano קיים",
    stats: [
      { label: "ארגון", value: "workflow first", tone: "accent" },
      { label: "צוות", value: "תהליכים ברורים", tone: "success" },
      { label: "מטרה", value: "פחות כפילויות", tone: "neutral" },
    ],
    actions: [
      { href: "/app/operations/advanced", label: "לפתוח את אזור התפעול המתקדם" },
      { href: "/app", label: "חזרה לבית החדש", kind: "secondary" },
    ],
    flow: [
      "המשתמש בוחר workflow או משימה במקום להיכנס לכלי טכני.",
      "המערכת מראה סטטוס, שלב הבא ופעולות זמינות לאותו תהליך.",
      "אפשר לעקוב אחרי ביצוע בלי לאבד הקשר בין צוות, לקוח ומסמך.",
    ],
    primaryPanel: {
      title: "מה יופיע כאן בהמשך",
      body: "החלון החדש יהפוך את שכבת התפעול להרבה יותר קוהרנטית.",
      items: [
        "רשימת workflows פעילים.",
        "מצב צוות, עומסים ותקיעויות.",
        "גישה לפעולות חוזרות ואוטומציות.",
      ],
    },
    secondaryPanel: {
      title: "איך הופכים את זה לידידותי",
      body: "תפעול טוב הוא כזה שלא מאלץ את המשתמש לזכור איפה כל דבר חי.",
      items: [
        "מפה קבועה של workflows.",
        "ללא שכבות ניווט סותרות או כפתורים כפולים.",
        "אותו layout לשגרה, חריגה ואישור.",
      ],
    },
    rightRailTitle: "מטרות UX",
    rightRailItems: [
      "להחליף מסכי כוח עמוסים בחלונות עבודה שמבינים הקשר.",
      "לשמור על גמישות בלי להקריב בהירות.",
      "לתת לצוות תחושת שליטה גם במשימות מורכבות.",
    ],
  },
  insights: {
    eyebrow: "Insights",
    title: "ה-AI והתובנות יעברו מ'אי נפרד' לשכבת החלטה טבעית במוצר.",
    description: "החלון הזה מרכז את התמונה הניהולית וההמלצות של המערכת, אבל בצורה שקטה וברורה למשתמש.",
    legacyHref: "/app/insights/advanced",
    legacyLabel: "AI Hub מתקדם",
    stats: [
      { label: "AI", value: "מוטמע בעבודה", tone: "accent" },
      { label: "ניהול", value: "תובנות לפי הקשר", tone: "success" },
      { label: "חוויה", value: "פחות gimmick", tone: "neutral" },
    ],
    actions: [
      { href: "/app/insights/advanced", label: "לפתוח את ה-AI Hub המתקדם" },
      { href: "/app", label: "חזרה לבית החדש", kind: "secondary" },
    ],
    flow: [
      "מתחילים מתובנות שהמערכת בחרה להבליט, לא מרשימת כלים.",
      "נכנסים לכל תובנה עם מקור ברור: לקוח, מסמך, גבייה או תהליך.",
      "מחזירים החלטה או פעולה ישירות לאזור העבודה הרלוונטי.",
    ],
    primaryPanel: {
      title: "החלונות המתוכננים כאן",
      body: "המטרה היא למסגר AI ככלי עבודה טבעי ולא כהצגה נפרדת.",
      items: [
        "Executive summary יומי.",
        "Recommendations לפי דחיפות והשפעה.",
        "צירוף context לכל insight לפני פעולה.",
      ],
    },
    secondaryPanel: {
      title: "מה יהפוך את זה לידידותי",
      body: "המשתמש צריך להבין מה ההמלצה, למה היא נוצרה, ומה אפשר לעשות עכשיו.",
      items: [
        "פחות פידים עמומים ויותר ניסוח החלטתי.",
        "קישור ישיר חזרה ללקוחות, מסמכים או חיוב.",
        "הסבר קצר על מקור כל המלצה.",
      ],
    },
    rightRailTitle: "עקרונות תכנון",
    rightRailItems: [
      "AI צריך להרגיש כמו עוזר של המוצר ולא כמו מסך צדדי.",
      "חלונות התובנות צריכים להיות קלים לקריאה גם תחת עומס.",
      "כל insight חייב להוביל לפעולה או להבנה ברורה, לא לסקרנות בלבד.",
    ],
  },
  settings: {
    eyebrow: "Settings",
    title: "ההגדרות יהפכו לקונסולה מסודרת ולא למסע wizard אינסופי.",
    description: "החלון הזה יתארגן לפי תחומי אחריות אמיתיים: ארגון, חיוב, AI, אינטגרציות וצוות.",
    legacyHref: "/app/settings/advanced",
    legacyLabel: "הגדרות מתקדמות",
    stats: [
      { label: "סדר", value: "לפי אחריות", tone: "accent" },
      { label: "גישה", value: "owner + team", tone: "success" },
      { label: "חוויה", value: "פחות wizard", tone: "neutral" },
    ],
    actions: [
      { href: "/app/settings/advanced", label: "לפתוח את ההגדרות המתקדמות" },
      { href: "/app", label: "חזרה לבית החדש", kind: "secondary" },
    ],
    flow: [
      "המשתמש בוחר תחום אחריות ולא עובר על מסך הגדרות אחד עמוס.",
      "כל קטגוריה מציגה summary, שדות חשובים ופעולות רלוונטיות.",
      "onboarding נשאר רק לרגעים שבהם באמת צריך להדריך תהליך חדש.",
    ],
    primaryPanel: {
      title: "קטגוריות ההגדרות העתידיות",
      body: "המבנה החדש יבטל את תחושת הבלגן של מסך הגדרות ענק אחד.",
      items: [
        "Organization להגדרות ארגון וצוות.",
        "Billing להגדרות מסחר ומנויים.",
        "AI & Integrations לחיבורים ולתצורת מערכת.",
      ],
    },
    secondaryPanel: {
      title: "למה זה נוח יותר למשתמש",
      body: "משתמשים חוזרים למסך הגדרות הרבה, ולכן הוא חייב להיות יציב וקל לזכירה.",
      items: [
        "קטגוריות קבועות עם שפה אחידה.",
        "שדות קריטיים בחלק העליון של כל חלון.",
        "פחות דרמות ויזואליות, יותר בהירות תפעולית.",
      ],
    },
    rightRailTitle: "עקרונות UX למסך הגדרות",
    rightRailItems: [
      "כל שינוי צריך להרגיש בטוח וברור לפני שמבצעים אותו.",
      "חלוקה לפי תחום מונעת אובדן והצפה של מידע.",
      "אותו מבנה חזותי בכל תת-מסך יפחית טעויות תפעול.",
    ],
  },
};
