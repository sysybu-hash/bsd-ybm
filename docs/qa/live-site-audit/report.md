# Live Site Audit

Checked at: 2026-04-22T19:48:12.437Z
Base URL: http://127.0.0.1:3000
User: owner@bsd-demo.test
Routes: 39
Viewport checks: 78

## Scan APIs

```json
{
  "engineMeta": {
    "status": 200,
    "body": {
      "configured": {
        "documentAI": true,
        "gemini": true,
        "openai": true
      },
      "gemini": {
        "flagshipModelId": "gemini-3.1-pro-stable",
        "primaryModelId": "gemini-3.1-pro-stable",
        "primaryLabel": "3.1-pro-stable"
      },
      "openai": {
        "defaultModelId": "gpt-5.4-turbo-2026-03",
        "modelOptions": [
          {
            "id": "gpt-5.4-turbo-2026-03",
            "label": "GPT-5.4 Turbo"
          },
          {
            "id": "gpt-4o-mini",
            "label": "GPT-4o mini"
          },
          {
            "id": "gpt-4o",
            "label": "GPT-4o"
          }
        ]
      }
    }
  },
  "triEngineMissingFile": {
    "status": 400,
    "body": {
      "error": "לא נמצא קובץ",
      "code": "missing_file"
    }
  },
  "triEngineStreamMissingFile": {
    "status": 400,
    "body": "{\"type\":\"error\",\"error\":\"לא נמצא קובץ\"}"
  }
}
```

## Findings

No blocking visual/runtime findings.

## Route Summary

- desktop /app: 200, buttons=8, links=40, text=1549, overflow=false
- desktop /app/admin: 200, buttons=8, links=40, text=1549, overflow=false
- desktop /app/advanced: 200, buttons=6, links=27, text=1254, overflow=false
- desktop /app/ai: 200, buttons=25, links=27, text=4911, overflow=false
- desktop /app/automations: 200, buttons=9, links=29, text=1832, overflow=false
- desktop /app/billing: 200, buttons=6, links=34, text=2262, overflow=false
- desktop /app/business: 200, buttons=18, links=19, text=1374, overflow=false
- desktop /app/clients: 200, buttons=12, links=29, text=1703, overflow=false
- desktop /app/clients/advanced: 200, buttons=12, links=29, text=1703, overflow=false
- desktop /app/documents: 200, buttons=18, links=25, text=2074, overflow=false
- desktop /app/documents/erp: 200, buttons=13, links=18, text=1589, overflow=false
- desktop /app/documents/issue: 200, buttons=16, links=18, text=1063, overflow=false
- desktop /app/documents/issued: 200, buttons=12, links=20, text=880, overflow=false
- desktop /app/finance: 200, buttons=8, links=30, text=1380, overflow=false
- desktop /app/help: 200, buttons=6, links=29, text=1502, overflow=false
- desktop /app/inbox: 200, buttons=11, links=23, text=982, overflow=false
- desktop /app/inbox/advanced: 200, buttons=11, links=23, text=982, overflow=false
- desktop /app/insights: 200, buttons=25, links=27, text=4911, overflow=false
- desktop /app/insights/advanced: 200, buttons=11, links=18, text=1468, overflow=false
- desktop /app/intelligence: 200, buttons=25, links=27, text=4911, overflow=false
- desktop /app/onboarding: 200, buttons=6, links=23, text=1092, overflow=false
- desktop /app/operations: 200, buttons=6, links=27, text=1455, overflow=false
- desktop /app/operations/advanced: 200, buttons=6, links=27, text=1455, overflow=false
- desktop /app/operations/meckano: 200, buttons=6, links=27, text=1455, overflow=false
- desktop /app/portal: 200, buttons=6, links=21, text=826, overflow=false
- desktop /app/projects: 200, buttons=6, links=22, text=579, overflow=false
- desktop /app/settings: 200, buttons=6, links=34, text=1075, overflow=false
- desktop /app/settings/advanced: 200, buttons=6, links=34, text=1075, overflow=false
- desktop /app/settings/automations: 200, buttons=9, links=29, text=1832, overflow=false
- desktop /app/settings/billing: 200, buttons=6, links=34, text=2262, overflow=false
- desktop /app/settings/operations: 200, buttons=6, links=35, text=1924, overflow=false
- desktop /app/settings/organization: 200, buttons=8, links=26, text=902, overflow=false
- desktop /app/settings/overview: 200, buttons=6, links=34, text=1075, overflow=false
- desktop /app/settings/platform: 200, buttons=8, links=40, text=1549, overflow=false
- desktop /app/settings/presence: 200, buttons=8, links=27, text=1152, overflow=false
- desktop /app/settings/profession: 200, buttons=7, links=26, text=1814, overflow=false
- desktop /app/settings/stack: 200, buttons=17, links=26, text=1609, overflow=false
- desktop /app/success: 200, buttons=6, links=21, text=502, overflow=false
- desktop /app/trial-expired: 200, buttons=8, links=40, text=1549, overflow=false
- mobile /app: 200, buttons=7, links=35, text=1480, overflow=false
- mobile /app/admin: 200, buttons=7, links=35, text=1480, overflow=false
- mobile /app/advanced: 200, buttons=5, links=22, text=1208, overflow=false
- mobile /app/ai: 200, buttons=24, links=22, text=4826, overflow=false
- mobile /app/automations: 200, buttons=8, links=24, text=1780, overflow=false
- mobile /app/billing: 200, buttons=5, links=29, text=2210, overflow=false
- mobile /app/business: 200, buttons=17, links=14, text=1316, overflow=false
- mobile /app/clients: 200, buttons=14, links=23, text=1556, overflow=false
- mobile /app/clients/advanced: 200, buttons=14, links=23, text=1556, overflow=false
- mobile /app/documents: 200, buttons=17, links=20, text=2018, overflow=false
- mobile /app/documents/erp: 200, buttons=12, links=13, text=1513, overflow=false
- mobile /app/documents/issue: 200, buttons=15, links=13, text=1032, overflow=false
- mobile /app/documents/issued: 200, buttons=11, links=15, text=806, overflow=false
- mobile /app/finance: 200, buttons=7, links=25, text=1325, overflow=false
- mobile /app/help: 200, buttons=5, links=24, text=1448, overflow=false
- mobile /app/inbox: 200, buttons=10, links=18, text=934, overflow=false
- mobile /app/inbox/advanced: 200, buttons=10, links=18, text=934, overflow=false
- mobile /app/insights: 200, buttons=24, links=22, text=4826, overflow=false
- mobile /app/insights/advanced: 200, buttons=10, links=13, text=1413, overflow=false
- mobile /app/intelligence: 200, buttons=24, links=22, text=4826, overflow=false
- mobile /app/onboarding: 200, buttons=5, links=18, text=1041, overflow=false
- mobile /app/operations: 200, buttons=5, links=22, text=1403, overflow=false
- mobile /app/operations/advanced: 200, buttons=5, links=22, text=1403, overflow=false
- mobile /app/operations/meckano: 200, buttons=5, links=22, text=1403, overflow=false
- mobile /app/portal: 200, buttons=5, links=16, text=774, overflow=false
- mobile /app/projects: 200, buttons=5, links=17, text=530, overflow=false
- mobile /app/settings: 200, buttons=5, links=29, text=1024, overflow=false
- mobile /app/settings/advanced: 200, buttons=5, links=29, text=1024, overflow=false
- mobile /app/settings/automations: 200, buttons=8, links=24, text=1780, overflow=false
- mobile /app/settings/billing: 200, buttons=5, links=29, text=2210, overflow=false
- mobile /app/settings/operations: 200, buttons=5, links=30, text=1873, overflow=false
- mobile /app/settings/organization: 200, buttons=7, links=21, text=851, overflow=false
- mobile /app/settings/overview: 200, buttons=5, links=29, text=1024, overflow=false
- mobile /app/settings/platform: 200, buttons=7, links=35, text=1480, overflow=false
- mobile /app/settings/presence: 200, buttons=7, links=22, text=1101, overflow=false
- mobile /app/settings/profession: 200, buttons=6, links=21, text=1763, overflow=false
- mobile /app/settings/stack: 200, buttons=16, links=21, text=1558, overflow=false
- mobile /app/success: 200, buttons=5, links=16, text=451, overflow=false
- mobile /app/trial-expired: 200, buttons=7, links=35, text=1480, overflow=false
