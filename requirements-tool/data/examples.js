/**
 * data/examples.js
 * Responsibility: Provides hardcoded example problem descriptions and a static
 * sample output object for the Section 4 preview, so no API call is needed
 * on page load.
 */

const EXAMPLE_PROBLEMS = {
  customerOnboarding: `Our customer onboarding process takes 3 weeks. Sales closes the deal, then manually emails the operations team, who create an account in the CRM, then email IT to set up system access, then email the customer with login details. There are frequent delays when any team is busy and customers sometimes receive incomplete access. We need to reduce onboarding time to under 5 days.`,

  purchaseApproval: `Our purchase order approval process requires a staff member to email their manager, who emails the finance team, who check the budget and email back approval or rejection. Orders under £500 take 3 days, over £500 take up to 2 weeks. We need a faster, auditable process with clear spend thresholds and automatic approval for low-value purchases.`,

  employeeOffboarding: `When an employee leaves the company, HR notifies their manager by email, who then needs to coordinate with IT to revoke system access, facilities to collect equipment, and payroll to process final payment. Steps are often missed, equipment goes unreturned, and system access sometimes remains active for weeks after departure. We need a structured checklist driven process with clear ownership and deadlines.`,

  itIncident: `When an IT incident occurs, users email the helpdesk which creates a ticket manually. The helpdesk triages and assigns to a technician by email. Updates are given ad hoc and users frequently chase for status. Critical incidents sometimes sit unresolved for hours because the on-call technician was not notified. We need automated triage, SLA-based escalation, and proactive user communication.`
};

const SAMPLE_OUTPUT = {
  process: {
    title: "Customer Onboarding Process",
    swimlanes: ["Sales", "Operations", "IT", "Customer"],
    steps: [
      {
        id: "s1",
        type: "start",
        label: "Deal Closed",
        role: "Sales",
        description: "Sales representative marks the deal as won in CRM"
      },
      {
        id: "s2",
        type: "process",
        label: "Create Account",
        role: "Operations",
        description: "Operations team creates a customer account in the CRM system"
      },
      {
        id: "s3",
        type: "decision",
        label: "Account Valid?",
        role: "Operations",
        description: "Operations verifies account details are complete and correct"
      },
      {
        id: "s4",
        type: "process",
        label: "Setup System Access",
        role: "IT",
        description: "IT provisions system access, credentials, and required permissions"
      },
      {
        id: "s5",
        type: "process",
        label: "Send Credentials",
        role: "IT",
        description: "IT sends login details and welcome guide to customer"
      },
      {
        id: "s6",
        type: "end",
        label: "Onboarding Complete",
        role: "Customer",
        description: "Customer confirms access and onboarding is marked complete"
      }
    ],
    connections: [
      { from: "s1", to: "s2", label: "" },
      { from: "s2", to: "s3", label: "" },
      { from: "s3", to: "s4", label: "Yes" },
      { from: "s3", to: "s2", label: "No" },
      { from: "s4", to: "s5", label: "" },
      { from: "s5", to: "s6", label: "" }
    ]
  },
  requirements: [
    {
      id: "FR-001",
      type: "functional",
      priority: "must",
      category: "Process",
      requirement: "The system shall automatically notify the Operations team when a deal is marked as won in the CRM.",
      notes: "Eliminates manual email handoff from Sales"
    },
    {
      id: "FR-002",
      type: "functional",
      priority: "must",
      category: "Integration",
      requirement: "The system shall automatically create a customer account in the CRM upon deal closure.",
      notes: "Requires CRM API integration"
    },
    {
      id: "FR-003",
      type: "functional",
      priority: "must",
      category: "Security",
      requirement: "The system shall automatically provision role-based system access for new customers within 24 hours of account creation.",
      notes: "IT must define role templates"
    },
    {
      id: "FR-004",
      type: "functional",
      priority: "should",
      category: "UX",
      requirement: "The system shall send a branded welcome email with login credentials and a getting-started guide to the customer.",
      notes: "Template to be provided by Marketing"
    },
    {
      id: "FR-005",
      type: "functional",
      priority: "could",
      category: "Process",
      requirement: "The system shall provide a real-time onboarding status dashboard visible to Sales and Operations.",
      notes: "Reduces inbound status queries"
    },
    {
      id: "NFR-001",
      type: "non-functional",
      priority: "must",
      category: "Performance",
      requirement: "The system shall complete the full onboarding workflow within 5 business days from deal closure.",
      notes: "Current baseline is 3 weeks"
    },
    {
      id: "NFR-002",
      type: "non-functional",
      priority: "must",
      category: "Compliance",
      requirement: "The system shall maintain a full audit log of all onboarding steps, timestamps, and responsible parties for a minimum of 3 years.",
      notes: "Required for ISO 27001 compliance"
    },
    {
      id: "NFR-003",
      type: "non-functional",
      priority: "should",
      category: "Performance",
      requirement: "The system shall achieve 99.5% uptime during core business hours (08:00–18:00 Mon–Fri).",
      notes: "Onboarding cannot pause due to system outage"
    }
  ],
  stakeholders: [
    {
      name: "Sarah Chen",
      role: "Sales Director",
      interest: "high",
      influence: "high",
      impact: "Directly responsible for deal closure; delayed onboarding damages client relationships and renewal rates.",
      action: "manage_closely"
    },
    {
      name: "Marcus Webb",
      role: "Operations Manager",
      interest: "high",
      influence: "medium",
      impact: "Owns the manual account creation steps that cause most delays; new system changes their team's workflow significantly.",
      action: "keep_informed"
    },
    {
      name: "Priya Patel",
      role: "IT Manager",
      interest: "medium",
      influence: "high",
      impact: "Responsible for access provisioning; must build and maintain integrations. Has authority to block technical approach.",
      action: "keep_satisfied"
    },
    {
      name: "New Customer",
      role: "End User",
      interest: "high",
      influence: "low",
      impact: "Directly experiences onboarding quality; poor experience increases churn risk in first 90 days.",
      action: "keep_informed"
    },
    {
      name: "James Okafor",
      role: "Finance Director",
      interest: "low",
      influence: "high",
      impact: "Must approve budget for new tooling; low day-to-day interest but high gate-keeping authority.",
      action: "keep_satisfied"
    }
  ]
};
