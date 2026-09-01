"""
Curated knowledge base of known voice scam narratives and patterns for semantic matching.
"""

KNOWN_SCAM_PATTERNS = [
    {
        "id": "SCAM_KYC_VERIFY",
        "category": "KYC & Account Suspension",
        "narrative": "Sir I am calling from your bank headquarters. Your KYC documents have expired today. Your bank account and UPI services will be permanently blocked within 1 hour unless you make an immediate verification transfer of funds to our secure server.",
        "keywords": ["kyc", "expired", "bank account", "blocked", "verification", "transfer", "immediately", "headquarters", "unblock"],
        "severity": 90.0
    },
    {
        "id": "SCAM_DIGITAL_ARREST",
        "category": "Law Enforcement & Digital Arrest",
        "narrative": "This is Officer Sharma from Delhi Police Cyber Crime / Narcotics Branch. A parcel containing illegal substances and fake passports has been intercepted in your name by customs. You are under digital arrest. Transfer security deposit funds immediately for RBI clearance or a police team will arrive at your residence.",
        "keywords": ["police", "cyber crime", "narcotics", "customs", "illegal", "parcel", "digital arrest", "fir", "security deposit", "rbi clearance"],
        "severity": 95.0
    },
    {
        "id": "SCAM_ELECTRICITY_BILL",
        "category": "Utility Disconnection Threat",
        "narrative": "Dear consumer, your electricity power supply will be disconnected tonight at 9:30 PM because your previous month bill was not updated. Please contact our electricity officer immediately and pay the pending verification charges via UPI.",
        "keywords": ["electricity", "power supply", "disconnected", "bill", "updated", "electricity officer", "tonight", "pending charges"],
        "severity": 85.0
    },
    {
        "id": "SCAM_TELEGRAM_TASK",
        "category": "Part-Time Job / Investment Task",
        "narrative": "Congratulations! You have been selected for a part-time hotel rating and YouTube video like job. Earn 3000 to 5000 rupees daily. To unlock the VIP investment task and withdraw your commission, you must first deposit 20,000 rupees to this merchant UPI ID.",
        "keywords": ["part-time", "rating", "youtube", "earn", "daily", "vip task", "commission", "withdraw", "deposit", "telegram"],
        "severity": 88.0
    },
    {
        "id": "SCAM_REFUND_REMOTE_ACCESS",
        "category": "Fake Refund & Remote Access App",
        "narrative": "Hello Sir, we are processing your accidental Amazon / Flipkart order refund of 15,000 rupees. To receive the money directly in your bank account, please install QuickSupport or AnyDesk application and enter your UPI PIN on the screen.",
        "keywords": ["refund", "order", "amazon", "flipkart", "quicksupport", "anydesk", "teamviewer", "remote access", "upi pin", "screen share"],
        "severity": 92.0
    },
    {
        "id": "SCAM_LOTTERY_REWARD",
        "category": "Lottery & Prize Winner",
        "narrative": "Congratulations! Your mobile number has won a cash prize of 25 Lakhs in Kaun Banega Crorepati lucky draw. To claim your lottery prize money, you must pay the government GST registration fee of 25,000 rupees immediately to our cashier UPI ID.",
        "keywords": ["congratulations", "cash prize", "lakhs", "lucky draw", "lottery", "claim", "gst fee", "registration", "cashier"],
        "severity": 80.0
    }
]
