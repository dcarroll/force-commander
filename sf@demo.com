{
    "activeConnection": "sf@demo.com",
    "sf@demo.com": {
        "passwordExpired": [
            "false"
        ],
        "serverUrl": [
            "https://dooder-dev-ed.my.salesforce.com/services/Soap/u/5.0/00Di0000000KpdA"
        ],
        "sessionId": [
            "00Di0000000KpdA!ARQAQPluAddFHNRYvWarLBYGZMYWEg1KmzR7d0W0HhBwgsWrp90D8ClOpv908ef9MAENnTCQJbR6gkUIlbB.tB4Pw21rkTwO"
        ],
        "userId": [
            "005i0000000NsyKAAS"
        ],
        "name": "sf@demo.com",
        "userInfo": [
            {
                "currencySymbol": [
                    "$"
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
                "userTimeZone": [
                    "America/Los_Angeles"
                ]
            }
        ]
    }
}