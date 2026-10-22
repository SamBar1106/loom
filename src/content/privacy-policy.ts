import {
  bullets,
  contactEmail,
  legalLastUpdated,
  link,
  paragraph,
  type LegalDocument,
} from "@/content/legal-document";

const contact = link(contactEmail, `mailto:${contactEmail}`);

export const privacyPolicy: LegalDocument = {
  slug: "privacy",
  title: "Privacy Policy",
  lastUpdated: legalLastUpdated,
  sections: [
    {
      id: "overview",
      heading: "Overview",
      blocks: [
        paragraph(
          "This Privacy Policy explains what personal information Orion Multiservices LLC, Clearwater, Florida (“Loom,” “we,” and “us”) collects through Loom, why we use it, and the requests you can make. It covers shop owners, buyers, and visitors.",
        ),
        paragraph(
          "A shop is an independent business. When we share a buyer’s order with the shop, the shop is responsible for how it uses that information and for its own customer notices. This policy describes Loom’s practices.",
        ),
      ],
    },
    {
      id: "what-we-collect",
      heading: "Information we collect",
      blocks: [
        paragraph(
          "Account. When a shop owner creates an account, we collect the owner’s name and email address. If the owner signs in with email and password, we collect the password and use it only to authenticate the account. If the owner chooses Google sign-in, Google sends us the name, email address, and Google account identifier used to open the session.",
        ),
        paragraph(
          "Shop and product data. We collect what the shop owner enters for the shop and the catalog. That includes the shop name, contact email, phone, address, currency, and timezone, and product titles, descriptions, prices, images, inventory, categories, and tax labels. We also collect inbox messages, including the sender’s name and the message.",
        ),
        paragraph(
          "Orders. When a buyer checks out, we collect the buyer’s name, email, and shipping details the order needs, along with the products, quantities, amounts, and order status. Stripe Checkout collects the buyer details together with the payment. Loom receives the name, email, shipping details, and order contents so the shop can fulfill the order.",
        ),
        paragraph(
          "Payment data. Stripe handles payment card data. Loom does not store card numbers. From Stripe, we receive the payment status, amount, currency, and Stripe identifiers for the charge and for the shop’s connected account. We also store whether that connected account can take charges and receive payouts. Stripe, not Loom, collects the bank details used for payouts.",
        ),
        paragraph(
          "Cookies and session. We use a cookie to keep a shop owner signed in, and a cookie that remembers the admin sidebar. Those are described under Cookies and sign-in.",
        ),
        paragraph(
          "We do not ask Loom to collect government identification numbers, precise device location, or biometric information.",
        ),
      ],
    },
    {
      id: "why",
      heading: "Why we use it",
      blocks: [
        paragraph("We use personal information to:"),
        bullets(
          ["Create and protect accounts, including Google sign-in and email and password sign-in."],
          ["Run shops, catalogs, orders, and the inbox."],
          ["Send a buyer to Stripe Checkout and record whether the payment succeeded."],
          ["Charge the transaction fee described in the Terms of Service, and show orders and fees to the shop."],
          ["Give the shop the order, including the buyer’s name, email, and shipping details, so the shop can fulfill it and handle refunds."],
          ["Detect abuse, fix problems, and protect shops and buyers."],
          ["Respond to you and meet legal duties, including tax and accounting duties on order records."],
          ["Tell shop owners about the account, the service, and changes to these policies."],
        ),
        paragraph(
          "We do not sell personal information. We do not use it for cross-context behavioral advertising.",
        ),
      ],
    },
    {
      id: "processors",
      heading: "Stripe, Google, and other recipients",
      blocks: [
        paragraph(
          "Stripe and Google act as processors. They process personal information for Loom for the purposes in this policy. They also operate their own services, which their privacy policies describe.",
        ),
        paragraph(
          "Stripe processes checkout, Stripe Connect destination charges, connected accounts, and payouts to shop owners. Card numbers are handled by Stripe. Stripe’s privacy policy is at ",
          link("stripe.com/privacy", "https://stripe.com/privacy"),
          ".",
        ),
        paragraph(
          "If you choose Google sign-in, Google processes that sign-in for us and provides the account details described above. Google’s privacy policy is at ",
          link("policies.google.com/privacy", "https://policies.google.com/privacy"),
          ".",
        ),
        paragraph(
          "We share the buyer’s order with the shop that sold the product. The order includes the buyer’s name, email, shipping details, and what was ordered.",
        ),
        paragraph(
          "We may also share information when the law requires it, to respond to a valid legal process, to prevent fraud or harm, or if the business is sold. A buyer of the business would have to honor this policy for information already collected.",
        ),
      ],
    },
    {
      id: "cookies",
      heading: "Cookies and sign-in",
      blocks: [
        paragraph(
          "We use cookies to run Loom. We do not use them to advertise to you, and we do not sell cookie data.",
        ),
        paragraph(
          "loom_session is an HttpOnly cookie that keeps a shop owner signed in. The browser sends it so we can recognize the account. Signing out clears it.",
        ),
        paragraph(
          "sidebar_state remembers whether the signed-in admin sidebar is open. It expires after about seven days.",
        ),
      ],
    },
    {
      id: "retention",
      heading: "How long we keep information",
      blocks: [
        paragraph(
          "We keep account, shop, and product information while the account is open. After a shop owner asks us to close the account, we delete that information or strip it of identifiers when we no longer need it for an open order, a dispute, security, or a legal duty.",
        ),
        paragraph(
          "We keep order records, including the buyer’s name, email, and shipping details, for as long as we need them to complete the order, handle refunds and disputes, and meet tax, accounting, and legal duties. We then delete them or strip the identifiers.",
        ),
        paragraph(
          "The sign-in cookie lasts until you sign out or it expires. The sidebar preference lasts about seven days. Stripe and Google keep information they process on their own schedules.",
        ),
      ],
    },
    {
      id: "rights",
      heading: "Your requests, including California",
      blocks: [
        paragraph(
          "You may ask us to access, correct, or delete personal information we hold about you. A shop owner may also ask us to close the account. Email ",
          contact,
          ". We may need to confirm the request is yours. We may keep information when we still need it for an open order, a dispute, security, or a legal duty such as tax records.",
        ),
        paragraph(
          "If you live in California, you may also ask us to:",
        ),
        bullets(
          ["Know the categories and specific pieces of personal information we collected about you, the categories of sources, the purposes, and the categories of recipients."],
          ["Delete personal information we collected from you, subject to the exceptions the law provides."],
          ["Correct inaccurate personal information."],
          ["Opt out of sale or sharing of personal information."],
        ),
        paragraph(
          "We do not sell personal information, and we do not share it for cross-context behavioral advertising. You may still email an opt-out request.",
        ),
        paragraph(
          "Send a California request to ",
          contact,
          ". An authorized agent may send it with proof that you allowed the agent to act for you. We will verify the request. We will not treat you differently for making one. We will respond within 45 days. If we need more time and the law allows it, we will tell you why and when we will respond.",
        ),
        paragraph(
          "For those requests, the categories we collect are identifiers (such as name, email, and account or payment identifiers), commercial information (such as products, orders, and fees), internet activity limited to the sign-in session and the sidebar preference, and business information the shop owner enters about the shop. We collect them from you, from the shop, from Stripe, and from Google when Google sign-in is used. We use and disclose them as this policy describes.",
        ),
        paragraph(
          "If you live in another state that gives you a similar right, you may use the same email address to exercise it.",
        ),
      ],
    },
    {
      id: "children",
      heading: "Children under 13",
      blocks: [
        paragraph(
          "Loom is not directed to children under 13, and we do not knowingly collect personal information from children under 13. Shop owners must be 18 or older. A shop may not use Loom to knowingly collect personal information from a child under 13.",
        ),
        paragraph(
          "If you believe a child under 13 has given us personal information, email ",
          contact,
          ". If we learn that we have it, we will delete it.",
        ),
      ],
    },
    {
      id: "changes",
      heading: "Changes",
      blocks: [
        paragraph(
          "We may update this policy. We will post the new policy on this page and change the Last updated date. If you have an account, we may email you when a change is material.",
        ),
      ],
    },
    {
      id: "contact",
      heading: "Contact",
      blocks: [
        paragraph("Orion Multiservices LLC, Clearwater, Florida."),
        paragraph(
          "Privacy requests, including access, correction, deletion, and California requests: ",
          contact,
          ".",
        ),
        paragraph("The rules for using Loom are in the ", link("Terms of Service", "/terms"), "."),
      ],
    },
  ],
};
