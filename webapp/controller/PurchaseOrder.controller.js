sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/routing/History",
    "../model/formatter"
], function (BaseController, JSONModel, History, formatter) {
    "use strict";

    return BaseController.extend("com.ncs.btp.buildinbox.controller.PurchaseOrder", {

        formatter: formatter,

        /* =========================================================== */
        /* lifecycle methods                                           */
        /* =========================================================== */

        /**
         * Called when the worklist controller is instantiated.
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
            this.getRouter().getRoute("po").attachPatternMatched(this._onObjectMatched, this);
            this.setModel(oViewModel, "objectView");
        },
        /* =========================================================== */
        /* event handlers                                              */
        /* =========================================================== */


        /**
         * Event handler  for navigating back.
         * It there is a history entry we go one step back in the browser history
         * If not, it will replace the current entry of the browser history with the worklist route.
         * @public
         */
        onNavBack: function () {
            var sPreviousHash = History.getInstance().getPreviousHash();
            if (sPreviousHash !== undefined) {
                // eslint-disable-next-line sap-no-history-manipulation
                history.go(-1);
            } else {
                this.getRouter().navTo("worklist", {}, true);
            }
        },

        /* =========================================================== */
        /* internal methods                                            */
        /* =========================================================== */

        /**
         * Binds the view to the object path.
         * @function
         * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
         * @private
         */
        _onObjectMatched: function (oEvent) {
            var sObjectId = oEvent.getParameter("arguments").objectId;
            this.taskID = sObjectId;
            this._bindView("/TaskCollection" + sObjectId);
            this.getTaskDetails(this.taskID.split(",")[1].split("'")[1]);
            this.getTaskInstanceContext(this.taskID.split(",")[1].split("'")[1]);
        },

        /**
         * Binds the view to the object path.
         * @function
         * @param {string} sObjectPath path to the object to be bound
         * @private
         */
        _bindView: function (sObjectPath) {
            var oViewModel = this.getModel("objectView");

            this.getView().bindElement({
                path: sObjectPath,
                events: {
                    change: this._onBindingChange.bind(this),
                    dataRequested: function () {
                        oViewModel.setProperty("/busy", true);
                    },
                    dataReceived: function () {
                        oViewModel.setProperty("/busy", false);
                    }
                }
            });
        },

        _onBindingChange: function () {
            var oView = this.getView(),
                oViewModel = this.getModel("objectView"),
                oElementBinding = oView.getElementBinding();

            // No data for the binding
            if (!oElementBinding.getBoundContext()) {
                this.getRouter().getTargets().display("objectNotFound");
                return;
            }

            var oResourceBundle = this.getResourceBundle(),
                oObject = oView.getBindingContext().getObject(),
                sObjectId = oObject.TaskDefinitionID,
                sObjectName = oObject.TaskCollection;

            oViewModel.setProperty("/busy", false);
            oViewModel.setProperty("/shareSendEmailSubject",
                oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId]));
            oViewModel.setProperty("/shareSendEmailMessage",
                oResourceBundle.getText("shareSendEmailObjectMessage", [sObjectName, sObjectId, location.href]));
        },

        onAccept: function () {
            var orderBusyDialog = new sap.m.BusyDialog();
            orderBusyDialog.open();
            // {"status": "COMPLETED", "decision": "approve"}
            var appModulePath = this.getModulePath();
            var that = this;
            $.ajax({
                url: appModulePath + "/bpmworkflowruntime/public/workflow/rest/v1/xsrf-token",
                method: "GET",
                headers: {
                    "X-CSRF-Token": "Fetch"
                },
                success: function (result, xhr, data) {
                    var token = data.getResponseHeader("X-CSRF-Token");
                    if (token === null) return;
                    // sap.m.MessageBox.information("The workflow is started");
                    //workflow-service/odata/v1/tcm/TaskCollection
                    var sTaskId = that.taskID.split(",")[1].split("'")[1];
                    var sPath = appModulePath + "/bpmworkflowruntime/public/workflow/rest/v1/task-instances/" + sTaskId;
                    var oPayload = { "status": "COMPLETED", "decision": "approve" };
                    // Start workflow
                    $.ajax({
                        url: sPath,
                        type: "PATCH",
                        data: JSON.stringify(oPayload),
                        headers: {
                            "X-CSRF-Token": token,
                            "Content-Type": "application/json"
                        },
                        async: false,
                        success: function (data) {
                            orderBusyDialog.close();
                            sap.m.MessageBox.information("Task completed");
                            that.navToMainPage();
                        },
                        error: function (data) {
                            orderBusyDialog.close();
                        }
                    });
                }
            });
        },

        onReject: function () {
            var orderBusyDialog = new sap.m.BusyDialog();
            orderBusyDialog.open();
            // {"status": "COMPLETED", "decision": "approve"}
            var appModulePath = this.getModulePath();
            var that = this;
            $.ajax({
                url: appModulePath + "/bpmworkflowruntime/public/workflow/rest/v1/xsrf-token",
                method: "GET",
                headers: {
                    "X-CSRF-Token": "Fetch"
                },
                success: function (result, xhr, data) {
                    var token = data.getResponseHeader("X-CSRF-Token");
                    if (token === null) return;
                    // sap.m.MessageBox.information("The workflow is started");
                    //workflow-service/odata/v1/tcm/TaskCollection
                    var sTaskId = that.taskID.split(",")[1].split("'")[1]
                    var sPath = appModulePath + "/bpmworkflowruntime/public/workflow/rest/v1/task-instances/" + sTaskId;
                    var oPayload = { "status": "REWORK", "decision": "reject" };
                    // Start workflow
                    $.ajax({
                        url: sPath,
                        type: "PATCH",
                        data: JSON.stringify(oPayload),
                        headers: {
                            "X-CSRF-Token": token,
                            "Content-Type": "application/json"
                        },
                        async: false,
                        success: function (data) {
                            orderBusyDialog.close();
                            sap.m.MessageBox.information("Task rejected successfully");
                            that.navToMainPage();
                        },
                        error: function (data) {
                            orderBusyDialog.close();
                        }
                    });
                }
            });
        },

        navToMainPage: function () {
            this.getRouter().navTo("worklist", {});
        },

        getTaskInstanceContext:function(sTaskInstanceId){
            let sWorkflowInsId = this.getModel("TaskDetails").getData().workflowInstanceId;
            //var sPath = this.getModulePath() + "/bpmworkflowruntime/public/workflow/rest/v1/task-instances/"+sTaskInstanceId+"/context"
            var sPath = this.getModulePath() + "/bpmworkflowruntime/public/workflow/rest/v1/workflow-instances/"+sWorkflowInsId+"/context";

            // var sPath = appModulePath + "/bpmworkflowruntime/v1/workflow-instances?definitionId="+sInstanceId;

            var oDefModel = new sap.ui.model.json.JSONModel();
            oDefModel.loadData(
                sPath, null, false, 'GET'
            );

            this.setModel(new sap.ui.model.json.JSONModel(JSON.parse(JSON.stringify(oDefModel.getData().startEvent.input))), "TaskContextData");
            console.log("context data: "+ JSON.stringify(oDefModel.getData().startEvent.input));
        },

        formatISODateString:function(sDate){
            var date = new Date(sDate);
            return date.toLocaleDateString('en-GB');
        },

        getTaskDetails: function (sTaskInstanceId) {

            let sPath = this.getModulePath() + "/bpmworkflowruntime/public/workflow/rest/v1/task-instances/"+sTaskInstanceId;

            let oDefModel = new sap.ui.model.json.JSONModel();
            oDefModel.loadData(
                sPath, null, false, 'GET'
            );

            this.setModel(oDefModel, "TaskDetails");
            // return oDefModel.getData();
        }
    });

});
