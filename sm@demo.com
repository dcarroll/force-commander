{
    "activeConnection": "sm@demo.com",
    "sm@demo.com": {
        "metadataServerUrl": [
            "https://na14.salesforce.com/services/Soap/m/28.0/00Dd0000000gFcU"
        ],
        "passwordExpired": [
            "false"
        ],
        "sandbox": [
            "false"
        ],
        "serverUrl": [
            "https://na14.salesforce.com/services/Soap/u/28.0/00Dd0000000gFcU"
        ],
        "sessionId": [
            "00Dd0000000gFcU!ARkAQHq7t1go7LACIbodWfvDuvLL0JRh3TTRtjy5wZqj4rFrW_ZPJYgKKKb_E1h9EAVi4LP3cxmd2L0wlgnimJuLgszSYzQL"
        ],
        "userId": [
            "005d0000001KHMbAAO"
        ],
        "userInfo": [
            {
                "accessibilityMode": [
                    "false"
                ],
                "currencySymbol": [
                    "$"
                ],
                "orgAttachmentFileSizeLimit": [
                    "5242880"
                ],
                "orgDefaultCurrencyIsoCode": [
                    "USD"
                ],
                "orgDisallowHtmlAttachments": [
                    "false"
                ],
                "orgHasPersonAccounts": [
                    "false"
                ],
                "organizationId": [
                    "00Dd0000000gFcUEAU"
                ],
                "organizationMultiCurrency": [
                    "false"
                ],
                "organizationName": [
                    "Demo"
                ],
                "profileId": [
                    "00ed00000015MRQAA2"
                ],
                "roleId": [
                    "00Ed0000000xWz6EAE"
                ],
                "sessionSecondsValid": [
                    "7200"
                ],
                "userDefaultCurrencyIsoCode": [
                    {
                        "$": {
                            "xsi:nil": "true"
                        }
                    }
                ],
                "userEmail": [
                    "dcarroll@salesforce.com"
                ],
                "userFullName": [
                    "Dave Carroll"
                ],
                "userId": [
                    "005d0000001KHMbAAO"
                ],
                "userLanguage": [
                    "en_US"
                ],
                "userLocale": [
                    "en_US"
                ],
                "userName": [
                    "sm@demo.com"
                ],
                "userTimeZone": [
                    "America/Los_Angeles"
                ],
                "userType": [
                    "Standard"
                ],
                "userUiSkin": [
                    "Theme3"
                ]
            }
        ],
        "name": "sm@demo.com"
    }
}