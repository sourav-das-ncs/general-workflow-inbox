sap.ui.define(["sap/ui/model/json/JSONModel", "../utils/Enum"], function (JSONModel, Enum) {
    "use strict";

    return {

        /**
         * Rounds the number unit value to 2 digits
         * @public
         * @param {string} sValue the number string to be rounded
         * @returns {string} sValue with 2 digits rounded
         */
        numberUnit: function (sValue) {
            if (!sValue) {
                return "";
            }
            return parseFloat(sValue).toFixed(2);
        },
        isAttributeVisible: function (property, taskDefinitionName) {
            var result = true,
                attributeList = [];
            var taskType = this.taskTypeVsDefinitionMap;
            switch (taskType[taskDefinitionName]) {
               
              
                
                case Enum.TT.VM:
                    attributeList = [Enum.TA.RequestorName,
                    Enum.TA.RequestorEmail,
                    Enum.TA.RequestNumber,
                    Enum.TA.VendorName,
                    Enum.TA.Country,
                    Enum.TA.Currency,
                    Enum.TA.POCEmail,
                    Enum.TA.PaymentTerms, Enum.TA.IncoTerms
                    ];
                    result = attributeList.includes(Enum.TA[property]);
                    break;
               
                default:
                    result = true;
            }
            return result;
        },

        isNavigationAllowed: function (taskDefinitionName) {
            return Enum.LEAVE_REQUEST === taskDefinitionName;
        },
        isForwardAllowed: function (taskDefinitionName) {
            return Enum.LEAVE_REQUEST === taskDefinitionName;
        },
        prepareTaskCustomAttributeSet: function (oData) {
            console.log(oData);
        },
        initializeTaskTypeMap: function () {
            // initialization
            //TODO: task type on task title need to fix for "OT"
            var taskTypeVsDefinitionMap = {};
          

            //Vendor Managment
            // taskTypeVsDefinitionMap[Enum.TD.VENDOR_TASK] = Enum.TT.VM;
            // taskTypeVsDefinitionMap[Enum.TD.VM_FINANCE_BANK] = Enum.TT.VM;
            // taskTypeVsDefinitionMap[Enum.TD.VM_FINANCE_CONF] = Enum.TT.VM;
            // taskTypeVsDefinitionMap[Enum.TD.VMT_SCREENING] = Enum.TT.VM;
            // taskTypeVsDefinitionMap[Enum.TD.VMT_CODE_CREATION] = Enum.TT.VM;
            // taskTypeVsDefinitionMap[Enum.TD.VM_REQ_TASK] = Enum.TT.VM;
            // taskTypeVsDefinitionMap[Enum.TD.VMT_CALLBACK] = Enum.TT.VM;
            // taskTypeVsDefinitionMap[Enum.TD.VMT_VERIFY] = Enum.TT.VM;
            // taskTypeVsDefinitionMap[Enum.TD.VMT_VERIFY1] = Enum.TT.VM;

            this.taskTypeVsDefinitionMap = taskTypeVsDefinitionMap;
        },

        getIcon:function(sDefName){
            if(sDefName === 'Manager Review'){
                return 'sap-icon://create-leave-request';
            }else if(sDefName === 'Approve Application (DP)' || sDefName === 'Approve Application (PC Head)' ) {
                return 'sap-icon://account' 
            }else if(sDefName === 'L1 Approver' || sDefName === 'L2 Approver'){
                return 'sap-icon://my-sales-order'; 
            }
            return 'sap-icon://activities';
        },

        isLeaveRequest:function(sDefName){
            if(sDefName === 'Manager Review'){
                return true;
            }
            return false;
        },
        isPORequest:function(sDefName){
            if(sDefName === 'L1 Approver' || sDefName === 'L2 Approver'){
                return true; 
            }
            return false;
        },
        isAccountRequest:function(sDefName){
            if(sDefName === 'Approve Application (DP)' || sDefName === 'Approve Application (PC Head)' ) {
                return true;
            }
            return false;
        },
        formatISODateString:function(sDate){
            var date = new Date(sDate);
            return date.toLocaleDateString('en-GB');
        }


    };

});