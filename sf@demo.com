{
    "activeConnection": "sf@demo.com",
    "sf@demo.com": {
        "metadataServerUrl": [
            "https://dooder-dev-ed.my.salesforce.com/services/Soap/m/28.0/00Di0000000KpdA"
        ],
        "passwordExpired": [
            "false"
        ],
        "sandbox": [
            "false"
        ],
        "serverUrl": [
            "https://dooder-dev-ed.my.salesforce.com/services/Soap/u/28.0/00Di0000000KpdA"
        ],
        "sessionId": [
            "00Di0000000KpdA!ARQAQNpAcJcGgfKc6pcoG3kZvuRGe0RK5Mqee3JFmYXQY9Xe0e.G82RbfFpAAYTBKoQ4YuNt83s5Ofsza.UheVfY4CmkT4No"
        ],
        "userId": [
            "005i0000000NsyKAAS"
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
                    "00Di0000000KpdAEAS"
                ],
                "organizationMultiCurrency": [
                    "false"
                ],
                "organizationName": [
                    "salesforce.com"
                ],
                "profileId": [
                    "00ei0000000q98QAAQ"
                ],
                "roleId": [
                    {
                        "$": {
                            "xsi:nil": "true"
                        }
                    }
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
                    "005i0000000NsyKAAS"
                ],
                "userLanguage": [
                    "en_US"
                ],
                "userLocale": [
                    "en_US"
                ],
                "userName": [
                    "sf@demo.com"
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
        "name": "sf@demo.com"
    }
}