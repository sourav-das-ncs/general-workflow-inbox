sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/routing/History",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/Label",
    "sap/m/Text",
    "sap/m/TextArea",
    "../model/formatter",
    'sap/m/ColumnListItem',
    'sap/m/SearchField',
    'sap/m/Token',
    'sap/ui/table/Column',
    'sap/m/Column'
], function (BaseController, JSONModel, History, Dialog, Button, Label, Text, TextArea, formatter,
    ColumnListItem, SearchField, Token,
    UIColumn, MColumn) {
    "use strict";

    return BaseController.extend("com.ncs.btp.buildinbox.controller.DocumentApproval", {

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

            //load the odata model
            // var appModulePath = this.getModulePath();
            // var oModel = new sap.ui.model.odata.ODataModel(appModulePath+"/sap/opu/odata/sap/ZCDSS_BP_SERVICEBIND/", true);
            // this.setModel(oModel);

            var oViewModel = new JSONModel({
                busy: true,
                delay: 0,
                isFinalApprover: false
            });
            this.getRouter().getRoute("da").attachPatternMatched(this._onObjectMatched, this);
            this.setModel(oViewModel, "objectView");

            let oMultiInput = this.byId("multiInput");
            this._oMultiInput = oMultiInput;

            let oInputRA = this.byId("multiInput1");
            this._oMultiInputRA = oInputRA;

            this.getView().setModel(new JSONModel([]), "UserRoles");

            // this.getLoggedinUserRoles();
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
            //this._bindView("vendorService>/bpHeader('')");
            this.getTaskDetails(this.taskID.split(",")[1].split("'")[1]);
            this.getTaskInstanceContext(this.taskID.split(",")[1].split("'")[1]);
            // this.getTaskCollectionDetails(sObjectId);
            this._setViewSettings();
            this._setModels();

        },

        getTaskCollectionDetails: function (sObjectId) {
            this.getView().getModel().read("/TaskCollection" + sObjectId + "/Description", {
                success: function (oData, oResponse) {
                    this.setModel(new sap.ui.model.json.JSONModel(JSON.parse(oData.Description)), "TaskCollectionData");
                    debugger;
                }.bind(this)
            });

            // var oDefModel = new sap.ui.model.json.JSONModel();
            // let oPromise = oDefModel.loadData(
            //     sPath, null, true, 'GET'
            // );

            // oPromise.then(function (odata) {
            //     debugger;
            // 	this.setModel(new sap.ui.model.json.JSONModel(JSON.parse(JSON.stringify(odata))), "TaskCollectionData");
            // 	console.log("TaskCollection data: " + JSON.stringify(odata));
            // }.bind(this));
        },

        _setModels: function () {
            let oCommentsModel = new JSONModel({
                comments: ""
            });
            this.setModel(oCommentsModel, "commentsModel");



        },

        _setViewSettings: function () {
            //isFinalApprover is based on TaskDefinitionID

            let oTaskDetails = this.getModel("TaskDetails").getData();
            // this.getModel("objectView").setProperty("/isFinalApprover",oTaskDetails.activityId === "form_financeDepartmentApprover_1");
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

        getLoggedinUserRoles: function () {
            let oModel = this.getOwnerComponent().getModel("role");
            let oBContext = oModel.bindContext("/getRoleCollections(...)");

            let oUserRoles = this.getView().getModel("UserRoles");

            oBContext.execute().then(
                function () {
                    var oResults = oBContext.getBoundContext().getObject();
                    oUserRoles.setData(JSON.parse(oResults.value));
                    oUserRoles.checkUpdate(true);
                    console.log(oResults);
                },
                function (oError) {
                    MessageBox.alert(oError.message, {
                        icon: MessageBox.Icon.ERROR,
                        title: "Error"
                    });
                });
        },

        getPORoles: function () {
            let oUserRoles = this.getView().getModel("UserRoles").getData();

            const ROLE_PATTERN = new RegExp("^ZSG_MM_PO_L[123]_APPR\.(.*)$");
            let poRoles = "";
            for (let oRole of oUserRoles) {
                if (ROLE_PATTERN.test(oRole)) {
                    poRoles += oRole + ",";
                }
            }

            return poRoles;
        },

        updateRolesToWF: function () {
            let oTaskData = this.getModel("TaskCollectionData").getData();
            let poRoles = this.getPORoles();

            let sWorkflowInsId = this.getModel("TaskDetails").getData().workflowInstanceId;
            const WF_ID = sWorkflowInsId;

            var sPath = this.getModulePath() + `/bpmworkflowruntime/public/workflow/rest/v1/workflow-instances/${WF_ID}/context`;

            if (oTaskData.LEVEL === "L1") {
                let payload = {
                    "startEvent": {
                        "input": {
                            "L1_UserRoles": poRoles,
                        }
                    }
                }
                return this.completeTask(sPath, payload);
            }
            if (oTaskData.LEVEL === "L2") {
                let payload = {
                    "startEvent": {
                        "input": {
                            "L2_UserRoles": poRoles,
                        }
                    }
                }
                return this.completeTask(sPath, payload);
            }
            // if (oTaskData.LEVEL === "L3") {

            // }
            return Promise.resolve(true);
        },

        onAccept: function (oEvent) {
            // this.updateService('A');



            this.updateService('A').then(function (data) {
                var orderBusyDialog = new sap.m.BusyDialog();
                orderBusyDialog.open();

                var sPath = this.getModulePath() + "/bpmworkflowruntime/public/workflow/rest/v1/task-instances/" + this.taskID.split(",")[1].split("'")[1];
                var oPayload = {
                    "status": "COMPLETED",
                    "decision": "approve"
                };
                var that = this;
                let oFuncSuccess = function (oResp) {
                    orderBusyDialog.close();
                    // let isFinalAppprover = this.getModel("objectView").getData().isFinalApprover;
                    let sMessage = "Request approved";


                    sap.m.MessageBox.success(sMessage, {
                        actions: [sap.m.MessageBox.Action.OK],
                        emphasizedAction: sap.m.MessageBox.Action.OK,
                        onClose: function (sAction) {
                            that.navToMainPage();
                        }
                    });


                }.bind(this);

                let oFuncError = function (data) {
                    orderBusyDialog.close();
                    sap.m.MessageBox.error("Error occurred! \n" + data);
                };

                ;
                this.updateRolesToWF().then(function (data) {

                    this.completeTask(sPath, oPayload).then(oFuncSuccess, oFuncError);

                }.bind(this)).catch(oFuncError);


            }.bind(this));


        },

        updateService: function (status) {
            let oBAPIModel = this.getModel("poService");
            let oTaskContext = this.getModel("TaskContextData").getData().startEvent.input;
            let oComments = this.getModel("commentsModel").getData();
            let oTaskData = this.getModel("TaskCollectionData").getData();
            debugger;
            // let isFinalAppprover = this.getModel("objectView").getData().isFinalApprover;
            let oPayload = {};
            // if(isFinalAppprover){
            //     //update finance data
            //     oPayload = this.getModel("finModel").getData();
            // }

            // oPayload.ParentId = oTaskContext.Id;
            // // oPayload.IsFinalApprover =  isFinalAppprover;
            // oPayload.ApprovalRemark = oComments.comments;
            // oPayload.HeaderStat = status;

            return new Promise(function (resolve, reject) {


                // oBAPIModel.callFunction("/UpdateToApproval", {    // function import name
                //     method: "POST",                             // http method
                //     urlParameters:  {"Zreqn" : oTaskContext.RequestId,
                //     "Action":status,
                //     "Comments":oComments.comments  }, // function import parameters        
                //     success: function(oData, response) { resolve(oData);},      // callback function for success
                //     error: function(oError){ reject("error");}                  // callback function for error
                // });

                //fill approver level based task data


                //get the final approver from task description
                let poRoles = this.getPORoles();

                var oUpdatePayload = {
                    Wfapprlevel: oTaskData.LEVEL,
                    Wfapprstatus: status === 'A' ? "APPR" : "REJ"
                };
                if (oTaskData.LEVEL === "L1") {
                    oUpdatePayload.L1approverDate = new Date();
                    oUpdatePayload.L1approverTime = this.getCurrentTimeInDurationFormat();
                    oUpdatePayload.L1comments = oComments.comments;
                    // oUpdatePayload.L1roles = poRoles;
                }
                if (oTaskData.LEVEL === "L2") {
                    oUpdatePayload.L2approverDate = new Date();
                    oUpdatePayload.L2approverTime = this.getCurrentTimeInDurationFormat();
                    oUpdatePayload.L2comments = oComments.comments;
                    // oUpdatePayload.L2roles = poRoles;
                }
                if (oTaskData.LEVEL === "L3") {
                    oUpdatePayload.L3approverDate = new Date();
                    oUpdatePayload.L3approverTime = this.getCurrentTimeInDurationFormat();
                    oUpdatePayload.L3comments = oComments.comments;
                    // oUpdatePayload.L3roles = poRoles;
                }

                const path = oBAPIModel.createKey("/POwfstatusSet", {
                    "PoReqno": oTaskContext.PORequestNumber, // with the value 999 for example
                    "PoNumber": oTaskContext.PONumber,
                    "DocType": oTaskContext.DocType,
                    "PruchGroup": oTaskContext.PurGrp

                });




                oBAPIModel.update(path, oUpdatePayload, {
                    success: function (oData, response) {

                        // if (status === 'R' || isFinalApprover) {
                        //     oBAPIModel.callFunction("/PoRelease", {    // function import name
                        //         method: "POST",                             // http method
                        //         urlParameters: {
                        //             "PoNum": oTaskContext.PONumber,
                        //             "Action": status === 'A' ? "APPR" : "REJ",
                        //             "PoReqno": oTaskContext.PORequestNumber
                        //         }, // function import parameters        
                        //         success: function (oData, response) { resolve(oData); },      // callback function for success
                        //         error: function (oError) { reject("error"); }                  // callback function for error
                        //     });
                        // } else {
                        //     resolve(oData);
                        // }


                        resolve(oData);
                    },      // callback function for success
                    error: function (oError) { reject("error"); }
                });



            }.bind(this));
            //return promise
        },

        onReject: function () {
            var orderBusyDialog = new sap.m.BusyDialog();
            orderBusyDialog.open();
            var sPath = this.getModulePath() + "/bpmworkflowruntime/public/workflow/rest/v1/task-instances/" + this.taskID.split(",")[1].split("'")[1];
            var oPayload = { "status": "COMPLETED", "decision": "reject" };
            var that = this;


            this.onRejectConfirm().then(function (data) {
                let oFuncSuccess = function (data) {
                    orderBusyDialog.close();
                    let sMessage = "Request Rejected";


                    sap.m.MessageBox.success(sMessage, {
                        actions: [sap.m.MessageBox.Action.OK],
                        emphasizedAction: sap.m.MessageBox.Action.OK,
                        onClose: function (sAction) {
                            that.navToMainPage();
                        }
                    });

                }.bind(this);

                let oFuncError = function (data) {
                    orderBusyDialog.close();
                    sap.m.MessageBox.error("Error occurred! \n" + data);
                };
                this.completeTask(sPath, oPayload).then(oFuncSuccess, oFuncError);
            }.bind(this));

        },

        onRejectConfirm: function () {

            //check the comments present
            let oComments = this.getModel("commentsModel").getData();
            return new Promise(function (resolve, reject) {
                // if(oComments.comments === '' ){
                //show dialog
                if (!this.oRejectDialog) {
                    this.oRejectDialog = new Dialog({
                        title: "Reject",
                        type: sap.m.DialogType.Message,
                        content: [
                            new Label({
                                text: "Do you want to reject this task?",
                                labelFor: "rejectionNote"
                            }),
                            new TextArea("rejectionNote", {
                                width: "100%",
                                placeholder: "Provide your comments"
                            })
                        ],
                        beginButton: new Button({
                            type: sap.m.ButtonType.Emphasized,
                            text: "Reject",
                            press: function () {
                                // let oUPromise = this.updateService('R');
                                this.updateService('R').then(function (data) {
                                    resolve("success");
                                }.bind(this));

                                this.oRejectDialog.close();

                            }.bind(this)
                        }),
                        endButton: new Button({
                            text: "Cancel",
                            press: function () {
                                this.oRejectDialog.close();
                                reject("cancel");
                            }.bind(this)
                        })
                    });
                }

                this.oRejectDialog.open();
                // }
            }.bind(this));

        },


        navToMainPage: function () {
            this.getRouter().navTo("worklist", {});
        },
        getTaskInstanceContext: function (sTaskInstanceId) {
            let sWorkflowInsId = this.getModel("TaskDetails").getData().workflowInstanceId;
            //var sPath = this.getModulePath() + "/bpmworkflowruntime/public/workflow/rest/v1/task-instances/"+sTaskInstanceId+"/context"
            var sPath = this.getModulePath() + "/bpmworkflowruntime/public/workflow/rest/v1/workflow-instances/" + sWorkflowInsId + "/context";

            // var sPath = appModulePath + "/bpmworkflowruntime/v1/workflow-instances?definitionId="+sInstanceId;

            var oDefModel = new sap.ui.model.json.JSONModel();
            let oPromise = oDefModel.loadData(
                sPath, null, true, 'GET'
            );

            oPromise.then(function (odata) {
                let oContextData = oDefModel.getData();
                this.setModel(new sap.ui.model.json.JSONModel(JSON.parse(JSON.stringify(oContextData))), "TaskContextData");
                console.log("context data: " + JSON.stringify(oContextData));

                this.getRequestDetails(oContextData.startEvent);


            }.bind(this));



        },

        getRequestDetails: function (wfContext) {

            // let oBindContext = this.getModel("vendorService").bindContext("/bpvend(Rootid="+sId+",IsActiveEntity=true)"); 
            // let oReqProm = oBindContext.requestObject(); 
            // oReqProm.then(function(oResp){
            //     console.log(oResp);
            //     debugger;
            // });

            wfContext.docid = "5881e88d-c3e8-4e4f-96da-4c0ed3310cb0";

            let sPath = this.getModulePath() + `/docapprsrv/service/general/DOCUMENT_TABLE(ID=${wfContext.docid})`;

            let oDefModel = new sap.ui.model.json.JSONModel();
            oDefModel.loadData(
                sPath, null, false, 'GET'
            );

            this.setModel(oDefModel, "documentService");

            // this.getView().bindElement({
            //     path: "documentservice>" + `/DOCUMENT_TABLE(ID=${wfContext.docid})`,
            //     events: {
            //         //change: this._onBindingChange.bind(this),
            //         dataRequested: function () {
            //             // debugger;
            //         },
            //         dataReceived: function (oResp) {
            //             // debugger;
            //         }
            //     }
            // });

            // this.getModel("vendorService").bindContext("/bpvend(Rootid=005056ac-e463-1edd-b3aa-4ed4dafa9d23,IsActiveEntity=true)");
            // this.getView().bindElement({
            // 	path: sObjectPath
            // });
        },



        getTaskDetails: function (sTaskInstanceId) {

            let sPath = this.getModulePath() + "/bpmworkflowruntime/public/workflow/rest/v1/task-instances/" + sTaskInstanceId;

            let oDefModel = new sap.ui.model.json.JSONModel();
            oDefModel.loadData(
                sPath, null, false, 'GET'
            );

            this.setModel(oDefModel, "TaskDetails");

            // return oDefModel.getData();
        },

        onDownloadPress: function (oEvent) {

            function downloadFile(url, fileName) {
                // Create a temporary anchor element
                const link = document.createElement('a');
                link.href = url;

                // Set the download attribute with the desired file name
                link.download = fileName;

                // Simulate a click on the anchor to trigger the download
                link.click();

                // Clean up: remove the anchor element
                document.body.removeChild(link);
            }

            let sPath = this.getModulePath() + `/docapprsrv/service/general`;
            const desiredFileName = 'my-downloaded-file.pdf';

            downloadFile(fileUrl, desiredFileName);



        }


    });

});
