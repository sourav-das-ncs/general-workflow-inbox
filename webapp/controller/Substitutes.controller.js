sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel"
], function (BaseController, JSONModel) {
    "use strict";

    return BaseController.extend("com.ncs.btp.buildinbox.controller.Substitutes", {

        /**
         * Navigates to the worklist when the link is pressed
         * @public
         */
        onInit: function () {
            // Model used to manipulate control states. The chosen values make sure,
            // detail page shows busy indication immediately so there is no break in
            // between the busy indication for loading the view's meta data
            var oViewModel = new JSONModel({
                busy: true,
                delay: 0
            });
            this.getRouter().getRoute("substitutes").attachPatternMatched(this._onObjectMatched, this);
            this.setModel(oViewModel, "objectView");

            var aUsers = [{ DisplayName: 'John', UniqueName: '70006111' },
            { DisplayName: 'Rohan', UniqueName: '50006143' },
            { DisplayName: 'Richard', UniqueName: '60006153' }];
            //
            var oViewModel = new JSONModel(aUsers);
            this.setModel(oViewModel, "userModel");

            var aProcessList = new JSONModel([
                {
                  "id": "com.demo.leaveprocess",
                  "version": "3",
                  "name": "leaveprocess",
                  "createdBy": "sb-clone-9ecf6664-e007-48a0-8d6f-3656ad119825!b6030|workflow!b56",
                  "createdAt": "2022-04-13T07:02:10.841Z",
                  "applicationScope": "shared",
                  "jobs": []
                },
                {
                  "id": "poprocess",
                  "version": "6",
                  "name": "poprocess",
                  "createdBy": "sb-clone-9ecf6664-e007-48a0-8d6f-3656ad119825!b6030|workflow!b56",
                  "createdAt": "2022-04-13T01:48:08.331Z",
                  "applicationScope": "shared",
                  "jobs": []
                }]);

                this.setModel(aProcessList, "WFDefinitionList");

                this.fetchCSRFToken();

        },
        _onObjectMatched: function (oEvent) {

        },

        onPressAddSubstn: function () {

        },
        handleUserSelectionChange: function (oEvent) {
            var oNavCon = sap.ui.getCore().byId("NAV_ADD_SUBST");
            var oListItem = oEvent.getSource().getBindingContext("userModel").getObject();

            var oModel = this._oAddSubstituteFrag.getModel();
            oModel.setProperty("/UniqueName",oListItem.UniqueName);
            oModel.setProperty("/DisplayName",oListItem.DisplayName);
            oModel.setProperty("/isSaveSubstnVisible",false);

            oNavCon.to("detail_profiles");
        },
        handleTaskSelectionChange: function (oEvent) {
            var oNavCon = sap.ui.getCore().byId("NAV_ADD_SUBST");
            var oListItem = oEvent.getSource().getBindingContext("WFDefinitionList").getObject();

            var oModel = this._oAddSubstituteFrag.getModel();
            oModel.setProperty("/taskName",oListItem.name);
            oModel.setProperty("/isSaveSubstnVisible",false);
    
            oNavCon.to("date_selection");
        },
        onChangeRange: function (oEvent) {
            // var oModel = this._oAddSubstituteFrag.getModel();
            
            //Date Instance Format
            var oFormat = sap.ui.core.format.DateFormat.getDateInstance({
                pattern: "yyyy-MM-dd"
            });

            //Display Format
            var displayFormat = sap.ui.core.format.DateFormat.getDateInstance({ // this format is used to display selected dates in calendar
                pattern: "dd MMM yyyy"
            });
            var oSelectedDates = oEvent.getSource().getSelectedDates();
            // var oCalendar = sap.ui.core.Fragment.byId(this.sAddSubUniqueId, "selectionCalendar");
            var oCalendar = sap.ui.getCore().byId("selectionCalendar");
            var dFromDateRaw = (oSelectedDates[0].getStartDate());
            // var oSelectDatesPage = sap.ui.core.Fragment.byId(this.sAddSubUniqueId, "date_selection");
            var dCurrentRaw = new Date();
            var dCurrent = oFormat.format((dCurrentRaw));
            var dFromDate = oFormat.format(dFromDateRaw);
            var dFromDateToDisplay = displayFormat.format(dFromDateRaw);
            var dToDateRaw = (oSelectedDates[0].getEndDate());
            var dToDate = null;
            var userDataModel = this._oAddSubstituteFrag.getModel();

            if (dToDateRaw) { // if to date and from date, both are selected
                dToDate = oFormat.format(dToDateRaw);
                var dToDateToDisplay = displayFormat.format(dToDateRaw);
                if (dFromDate < dCurrent || dToDate < dCurrent) { // if selected dates are not valid
                    oCalendar.removeAllSelectedDates(); // unselect all dates
                    dFromDate = dCurrent; // set current date to from date
                    dToDate = null; // set to date as null
                    userDataModel.setProperty("/period", "From "); // donot show any date selected under substitution period
                    return; // donot process further
                }
                // display start date and end date under substitution period
                userDataModel.setProperty("/period", 'From' + " " +
                    dFromDateToDisplay + " To " + dToDateToDisplay);
            } else { // if only from date is selected
                if (dFromDate < dCurrent) { // if from date is invalid
                    dFromDate = dCurrent; // set current date as from date
                    oCalendar.removeAllSelectedDates(); // unselect all selected dates
                } else { // if from date is valid
                    userDataModel.setProperty("/period", "From " +
                        dFromDateToDisplay + ""); //display fromdate under substitution period
                }
            }

            userDataModel.setProperty("/startDate", dFromDateRaw);
            userDataModel.setProperty("/endDate", dToDateRaw);
            userDataModel.setProperty("/isSaveSubstnVisible",true);
        },

        onPressSaveSubstnRule: function () {
            var oSubModelData = this._oAddSubstituteFrag.getModel().getData();

            var oPayload = {
                "__metadata": {
                    "type": "com.sap.bpm.wfs.tcm.metadata.SubstitutionRule"
                },
                "SAP__Origin": "NA",
                "User": oSubModelData.UniqueName,
                "BeginDate": oSubModelData.startDate,
                "EndDate": oSubModelData.endDate,
                "Mode": "RECEIVE_TASKS",
                "IsEnabled": true
            };

            this.getView().getModel().create("/SubstitutionRuleCollection", oPayload, {
                success: function (oCreatedEntry) {
                    this.onPressCancelSubstnRule();
                    sap.m.MessageToast.show("Substitution created!");

                }.bind(this),
                error: function (oError) {
                    this.onPressCancelSubstnRule();
                }.bind(this)
            });
        },
        onPressAddSubstn: function () {
            if (!this._oAddSubstituteFrag) {
                this._oAddSubstituteFrag = sap.ui.xmlfragment(
                    "com.ncs.btp.buildinbox.fragment.AddSubstitute", this);
                this.getView().addDependent(this._oAddSubstituteFrag);
                this._oAddSubstituteFrag.setModel(new JSONModel({isSaveSubstnVisible:false}));                
            }
            // this.navToTargetPage("detail_substitutes");

            var oNavCon = sap.ui.getCore().byId("NAV_ADD_SUBST");
            oNavCon.to("detail_substitutes");

            sap.ui.getCore().byId("selectionCalendar").removeAllSelectedDates();

            sap.ui.getCore().byId("subsUserListId").removeSelections();

            // this.onActionResetModels();
            this._oAddSubstituteFrag.open();
        },
        onPressCancelSubstnRule: function (oEvent) {
            this._oAddSubstituteFrag.close();
        },
        onNavBack: function (oEvent, oParameters) {
            var pageStack = oEvent.getSource().getParent().getPages();
            var backPage;
            jQuery.sap.each(pageStack, function (p) {
                if (pageStack[p].getId() === oEvent.getParameter("id")) {
                    backPage = pageStack[p - 1].getId();
                }
            });
            var oNavCon = sap.ui.getCore().byId("NAV_ADD_SUBST");
            oNavCon.to(backPage);

            // this.navToTargetPage(backPage);
            sap.ui.getCore().byId("LST_PROFILES").removeSelections();
            // this.getUIControl("LST_ALL_TOPICS").removeSelections();
            sap.ui.getCore().byId("selectionCalendar").removeAllSelectedDates();
            // this.modelAssignment("userDataModel").setProperty("/isSaveSubstnVisible", false);
        },
        onPressBackToInbox: function (oEvent) {
            this.getRouter().navTo("worklist", {});
            // var oRouter = this.getOwnerComponent().getRouter();
            // oRouter.navTo("worklist",{});
            // this.handleNav(null, false, "inboxPage");
        },
        onPressDeleteSubstn: function (oEvent) {
            var oRow = this.getView().byId("idSubTable").getSelectedItem();
            var sPath ="/DeleteSubstitutionRule?SubstitutionRuleID='"+oRow.getBindingContext().getObject().SubstitutionRuleID+"'";
            this.callRESTService(sPath, "POST", this.TOKEN, function(){sap.m.MessageToast.show("Substitution Deleted!"); });
        }

    });

});