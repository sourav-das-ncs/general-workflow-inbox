sap.ui.define([], function (e) {
    return {
        //Task Attributes
        TA: {
            //Common
            uid: "Purchase Order",
            netValue: "Net Value",
            RequestorName: "Requested By",
            vname: "Vendor Name",
            vcode: "Vendor Code",

            empname: "Employee Name",
            leaveType: "Leave Type",
            leavedays: "No. Of Days",
            fromdate: "From Date",
            todate: "To Date",
            reason: "Reason",

            requestID: "Request ID",
            name: "Staff Name",
            pcName: "PC Name/Sub-PC",
            accounts:"Appointment Applied",
            reason:"Reason",
            date:"Date of Application",


          
            CostCenter: "Cost Center",
            Sector: "Sector",
            Supervisor2Name: "OTMS Supervisor2",
            AOName: "Next Line Manager",
            HODName: "Next Line Manager",
            CumulativeHours: "Cumulative Hours",
            MonthlyException: "Monthly Exemption",

            //Leave Request
            // "RequestorName", "EMPLOYEE_ID", "EMPLOYEE_NAME", "LEAVE_TYPE", "START_DATE", "END_DATE", "START_TIME", "END_TIME",
            // 		"DURATION",
            // 		"REQUEST_TYPE",
            // 		"COUNTRY_REGION", "NEW_NOTE"

            EMPLOYEE_ID: "Employee ID",
            EMPLOYEE_NAME: "Employee Name",
            LEAVE_TYPE: "Leave Type",
            START_DATE: "Start Date",
            END_DATE: "End Date",
            START_TIME: "Start Time",
            END_TIME: "End Time",
            DURATION: "Duration",
            REQUEST_TYPE: "Request Type",
            COUNTRY_REGION: "Country-State/Province",
            NEW_NOTE: "Comments",

            //Billing Request
            // "RequestorName", "EntityName", "CustomerName", "BillingCurrency", "BillingAmount", "GSTAmount", "BillingWGSTAmount","PaymentTerm","ApproverName"

            EntityName: "Entity Name",
            CustomerName: "Customer Name",
            BillingCurrency: "Billing Currency",
            BillingAmount: "Billing Amount",
            GSTAmount: "GST Amount",
            BillingWGSTAmount: "Billing w GST Amount",
            PaymentTerm: "Payment Term",
            ApproverName: "Approver Name",

            //Credit Note
            // "RequestorName", "EntityName", "CustomerName", "CreditNoteCurrency", "CreditNoteAmount", "GSTAmount","CreditNoteWGSTAmount","ApproverName"

            CreditNoteCurrency: "Credit Note Currency",
            CreditNoteAmount: "Credit Note Amount",
            CreditNoteWGSTAmount: "Credit Note With GST Amount",

            //Vendor Management
            // "RequestorName", "RequestorEmail", "RequestNumber", "VendorName", "Country", "Currency", "POCEmail", "PaymentTerms","IncoTerms"

            RequestorEmail: "Requestor Email",
            RequestNumber: "Request No",
            VendorName: "Vendor Name",
            Country: "Country Of Origin",
            Currency: "Currency",
            POCEmail: "Point of Contact",
            PaymentTerms: "Payment Terms",
            IncoTerms: "Incoterms",

            //PTP
            // "RequestorName", "RequestNumber", "VendorName", "EntityName", "SRCategory"
            SRCategory: "Case Category",
            ROName: "Reporting Officer"
        },
        //Task Definitions
        TD: {
            VENDOR_TASK: "VendorTask",
            VM_FINANCE_BANK: "VMFinanceBankTask",
            VM_FINANCE_CONF: "VMFinanceConfirmationTask",
            VM_REQ_TASK: "VMRequestorTask",
            VMT_SCREENING: "VMScreeningTask",
            VMT_CALLBACK: "VMTCallBackTask",
            VMT_CODE_CREATION: "VMTCodeCreationTask",
            VMT_VERIFY: "VMTTask",
            VMT_VERIFY1: "VMTTask1",
            APPROVING_OFFICER: "OTMS Next Line Manager Task",
            REPORTING_OFFICER: "OTMS Manager Task",
            HOD: "OTMS HOD Task",
            MANAGER: "OTMS Supervisor1 Task",
            NEXTLINE_MANAGER: "OTMS Supervisor2 Task",
            OTC_BR_HOD: "BR HOD Approval",
            OTC_BR_OTC: "BR OTC Review",
            OTC_BR_OTC_LEAD: "BR OTC Lead Review",
            OTC_BR_REQ_REV: "BR Requestor Revision",
            OTC_BR_CUST_PORTAL: "BR Upload to Customer Portal",
            OTC_CN_HOD: "CN HOD",
            OTC_CN_APP: "CN Approver",
            OTC_CN_OTC_LEAD: "CN OTC Lead Review",
            OTC_CN_OTC: "CN OTC Review",
            OTC_CN_REQ_REV: "CN Requestor",
            OTC_CN_GFC: "CN GFC",
            OTC_CN_OPS_SUPPORT: "CN Ops Support",
            OTC_CN_PTP: "CN PTP",
            OTC_CN_VERIFIER: "CN Verifier",
            OTC_CN_CUST_PORTAL: "CN Upload Customer to Portal",
            PTP_NORMAL_TASK: "PTP Normal Task",
            PTP_ESCALATION_TASK: "Escalation Task",
            PTP_CLARIFICATION_TASK: "Clarification Task",
            PTP_RESOLVE_CONFIRM_TASK: "Resolve Confirm Task",
            UNKNOWN: "UNKNOWN"
        }
    };
});