import {
  bullets,
  contactEmail,
  legalLastUpdated,
  link,
  paragraph,
  type LegalDocument,
} from "@/content/legal-document";

const contact = link(contactEmail, `mailto:${contactEmail}`);

export const termsOfService: LegalDocument = {
  slug: "terms",
  title: "Terms of Service",
  lastUpdated: legalLastUpdated,
  sections: [
    {
      id: "agreement",
      heading: "Agreement",
      blocks: [
        paragraph(
          "These Terms of Service are a contract between you and Orion Multiservices LLC, Clearwater, Florida (“Loom,” “we,” and “us”). They cover the Loom storefront service.",
        ),
        paragraph(
          "The terms apply to shop owners who create or use a shop, and to buyers who check out. “You” means the person the section applies to. If you do not agree, do not create an account and do not check out.",
        ),
      ],
    },
    {
      id: "the-service",
      heading: "The service",
      blocks: [
        paragraph(
          "Loom lets a shop owner sign in, create a shop, and list products for sale. Buyers can view a shop and pay for products. Loom is software. The shop owner is the seller of the products listed in that shop.",
        ),
        paragraph(
          "Buyer checkout uses Stripe Connect destination charges. Stripe processes the payment, and Stripe pays the shop owner. Payouts to the shop owner’s bank account are made by Stripe under the shop owner’s Stripe account.",
        ),
      ],
    },
    {
      id: "accounts",
      heading: "Accounts",
      blocks: [
        paragraph(
          "A shop owner signs in with Google, or with an email address and a password. You must provide your real name and a real email address. You must be at least 18 years old and able to enter a contract.",
        ),
        paragraph(
          "You are responsible for activity on your account and for keeping your password confidential. If you think someone else is using your account, email ",
          contact,
          ".",
        ),
        paragraph(
          "We may refuse a registration, or close an account, that breaks these terms or that we cannot serve.",
        ),
      ],
    },
    {
      id: "shops-and-buyers",
      heading: "Shops, products, and buyers",
      blocks: [
        paragraph(
          "The shop owner may list products the shop has the right to sell. The shop owner is responsible for the products, the price, the description, the inventory, and getting the order to the buyer. The shop owner is also responsible for customer service about those products.",
        ),
        paragraph(
          "The sale is between the buyer and the shop. Loom is not the seller, the manufacturer, or the shipper. Loom is not a party to that sale.",
        ),
        paragraph(
          "A buyer should read the listing and the price before paying. By checking out, the buyer agrees to purchase from the shop on that listing, and agrees that Stripe will process the payment.",
        ),
      ],
    },
    {
      id: "acceptable-use",
      heading: "Acceptable use",
      blocks: [
        paragraph("Shop owners and buyers may not use Loom to:"),
        bullets(
          ["Break the law, or help someone else break the law."],
          ["Sell illegal, stolen, or counterfeit goods, or goods the shop has no right to sell."],
          ["Infringe someone else’s intellectual property, privacy, or other rights."],
          ["Mislead a buyer about the product, the price, the shop, or who the seller is."],
          ["Commit fraud, launder money, or submit a charge the buyer did not authorize."],
          ["Collect card numbers in Loom, or ask a buyer to send card numbers outside Stripe."],
          ["Interfere with the service, access another shop’s data, or probe the service without permission."],
          ["Upload malware, or abuse sign-in, checkout, or messages."],
          ["Offer a business Stripe will not support on a connected account."],
          ["Create an account for a child under 13, or knowingly collect personal information from a child under 13."],
        ),
        paragraph(
          "We may remove a product, or suspend a shop or an account, that breaks this section.",
        ),
      ],
    },
    {
      id: "fees",
      heading: "Fees and payouts",
      blocks: [
        paragraph(
          "Buyers pay through Stripe. On a destination charge, Stripe processes the card payment and transfers the funds to the shop owner’s connected Stripe account. Loom does not hold buyer funds and does not store card numbers.",
        ),
        paragraph(
          "On each successful charge, Loom charges the shop one transaction fee of 2.9% + 30¢, in United States dollars. That fee already includes payment-processor (Stripe) fees. Stripe collects this transaction fee as part of the destination charge and pays the remaining amount to the shop owner’s connected Stripe account. Stripe then pays the shop owner on Stripe’s payout schedule. A payment that does not succeed does not incur the transaction fee.",
        ),
        paragraph(
          "The shop owner must finish Stripe Connect onboarding before the shop can take payments and receive payouts, and must keep that Stripe account in good standing.",
        ),
        paragraph(
          "If a charge is refunded in full, Loom returns the transaction fee on that charge. A partial refund reduces the transaction fee by the same percentage as the refund.",
        ),
      ],
    },
    {
      id: "refunds-and-taxes",
      heading: "Refunds and taxes",
      blocks: [
        paragraph(
          "The shop owner is responsible for refunds and returns on the shop’s products. The shop owner sets the refund policy, gives the refunds that policy or the law requires, and handles buyer questions about the product and the shipment. Refunds of a buyer’s payment are issued through Stripe from the shop’s funds. Loom does not decide a product refund.",
        ),
        paragraph(
          "The shop owner is responsible for taxes on the shop’s sales and income, including collecting and remitting sales tax where it is due. Loom does not calculate or file those taxes. A tax label stored on a product is a catalog label only.",
        ),
      ],
    },
    {
      id: "ending-use",
      heading: "Ending use",
      blocks: [
        paragraph(
          "You may stop using Loom at any time. A shop owner may ask us to close an account by emailing ",
          contact,
          ".",
        ),
        paragraph(
          "We may suspend or close access if you break these terms, if the law requires it, if Stripe restricts the connected account, or if we need to protect buyers, shops, or the service. We may also stop offering Loom. If we stop the service, we will make a reasonable effort to email shop owners at the address on the account.",
        ),
        paragraph(
          "Fees on charges that already succeeded still apply. Acceptable use, fees, refunds and taxes, disclaimers, the limit on liability, and Florida law still apply after access ends. We keep order records as the ",
          link("Privacy Policy", "/privacy"),
          " describes.",
        ),
      ],
    },
    {
      id: "disclaimers",
      heading: "Disclaimers",
      blocks: [
        paragraph(
          "The service is provided “as is” and “as available.” To the fullest extent the law allows, we disclaim warranties of merchantability, fitness for a particular purpose, and non-infringement, and any warranty that the service will be uninterrupted, secure, or error free.",
        ),
        paragraph(
          "We do not warrant the products a shop lists, the accuracy of a shop’s description, or that a shop will make sales. We do not warrant Stripe, Google, or any other company’s service.",
        ),
      ],
    },
    {
      id: "liability",
      heading: "Limitation of liability",
      blocks: [
        paragraph(
          "To the fullest extent the law allows, Loom and its members, employees, and agents are not liable for indirect, incidental, special, consequential, or punitive damages, or for lost profits, lost revenue, lost data, or lost goodwill, arising out of the service or these terms.",
        ),
        paragraph(
          "To the fullest extent the law allows, Loom’s total liability for all claims relating to the service or these terms is limited to the greater of the transaction fees the shop paid Loom in the 12 months before the claim, or $100.",
        ),
        paragraph(
          "These limits apply to shop owners and to buyers, in contract, tort, or any other claim, whether or not we knew the loss was possible. They apply only as far as the law allows. If the law does not allow a limit, that limit does not apply.",
        ),
      ],
    },
    {
      id: "changes",
      heading: "Changes",
      blocks: [
        paragraph(
          "We may change these terms, including the transaction fee. We will post the updated terms on this page and change the Last updated date. If you have an account, we may also email the address on the account when a change is material.",
        ),
        paragraph(
          "If you keep using Loom after the updated terms are posted, you agree to them. If you do not agree, stop using Loom. A shop owner who does not agree should email ",
          contact,
          " and ask us to close the account.",
        ),
      ],
    },
    {
      id: "florida-law",
      heading: "Florida law",
      blocks: [
        paragraph(
          "Florida law governs these terms and the service, without regard to conflict-of-law rules. The courts of Pinellas County, Florida are the venue for disputes about these terms or the service, and you and Loom consent to personal jurisdiction there.",
        ),
      ],
    },
    {
      id: "other",
      heading: "Other terms",
      blocks: [
        paragraph(
          "If a court holds that one part of these terms cannot be enforced, the rest stays in effect. You may not assign these terms without our consent. We may assign them, including as part of a sale of the service.",
        ),
        paragraph(
          "These terms and the Privacy Policy are the entire agreement between you and Loom about the service. The shop’s listing and the shop’s own policies govern the shop’s sale to a buyer. A Stripe agreement governs the relationship between you and Stripe.",
        ),
      ],
    },
    {
      id: "contact",
      heading: "Contact",
      blocks: [
        paragraph("Orion Multiservices LLC, Clearwater, Florida."),
        paragraph("Questions about these terms: ", contact, "."),
        paragraph("How we handle personal information is in the ", link("Privacy Policy", "/privacy"), "."),
      ],
    },
  ],
};
