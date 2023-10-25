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
], function (BaseController, JSONModel, History, Dialog,Button,Label,Text,TextArea, formatter,
    ColumnListItem, SearchField, Token,
    UIColumn, MColumn) {
    "use strict";

    return BaseController.extend("com.ncs.btp.buildinbox.controller.SalesTagUntag", {

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
                isFinalApprover:false
            });
            this.getRouter().getRoute("sales").attachPatternMatched(this._onObjectMatched, this);
            this.setModel(oViewModel, "objectView");

            let oMultiInput = this.byId("multiInput");
            this._oMultiInput = oMultiInput;

            let oInputRA = this.byId("multiInput1");
            this._oMultiInputRA = oInputRA;
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

            this._setViewSettings();
            this._setModels();

        },

        _setModels:function(){
            let oCommentsModel = new JSONModel({
               comments:""
            });
            this.setModel(oCommentsModel, "commentsModel");

          
            
        },

        _setViewSettings:function(){
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

        onAccept: function (oEvent) {
            // this.updateService('A');

            this.updateService('A').then(function (data) {
                var orderBusyDialog = new sap.m.BusyDialog();
                orderBusyDialog.open();
                var sPath = this.getModulePath() + "/bpmworkflowruntime/public/workflow/rest/v1/task-instances/" + this.taskID.split(",")[1].split("'")[1];
                var oPayload = { "status": "COMPLETED", "decision": "approve" };
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
                    sap.m.MessageBox.error("Error occurred! \n"+data);
                };
    
                this.completeTask(sPath,oPayload).then(oFuncSuccess,oFuncError);
            }.bind(this));

           
        },

        updateService:function(status){
            let oBAPIModel = this.getModel("salesService");
            let oTaskContext = this.getModel("TaskContextData").getData();
            let oComments = this.getModel("commentsModel").getData();

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
                // oBAPIModel.create("/FinanceDataSet",oPayload,{success:function(data){
                //     console.log('updated comments');
                   
                // }});

                oBAPIModel.callFunction("/UpdateToApproval", {    // function import name
                    method: "POST",                             // http method
                    urlParameters:  {"Zreqn" : oTaskContext.RequestId,
                    "Action":status,
                    "Comments":oComments.comments  }, // function import parameters        
                    success: function(oData, response) { resolve(oData);},      // callback function for success
                    error: function(oError){ reject("error");}                  // callback function for error
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
                    sap.m.MessageBox.error("Error occurred! \n"+data);
                };
                this.completeTask(sPath,oPayload).then(oFuncSuccess,oFuncError);
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
        getTaskInstanceContext:function(sTaskInstanceId){
            let sWorkflowInsId = this.getModel("TaskDetails").getData().workflowInstanceId;
            //var sPath = this.getModulePath() + "/bpmworkflowruntime/public/workflow/rest/v1/task-instances/"+sTaskInstanceId+"/context"
            var sPath = this.getModulePath() + "/bpmworkflowruntime/public/workflow/rest/v1/workflow-instances/"+sWorkflowInsId+"/context";
           
            // var sPath = appModulePath + "/bpmworkflowruntime/v1/workflow-instances?definitionId="+sInstanceId;

            var oDefModel = new sap.ui.model.json.JSONModel();
            let oPromise = oDefModel.loadData(
                sPath, null, true, 'GET'
            );

            oPromise.then(function (odata) {
                let oContextData = oDefModel.getData().startEvent.input;
				this.setModel(new sap.ui.model.json.JSONModel(JSON.parse(JSON.stringify(oContextData))), "TaskContextData");
				console.log("context data: " + JSON.stringify(oContextData));

                this.getRequestDetails(oContextData.RequestId,oContextData.EmpId);
				
				
			}.bind(this));


         
        },

        getRequestDetails: function (sId,sEmpId) {

            // let oBindContext = this.getModel("vendorService").bindContext("/bpvend(Rootid="+sId+",IsActiveEntity=true)"); 
            // let oReqProm = oBindContext.requestObject(); 
            // oReqProm.then(function(oResp){
            //     console.log(oResp);
            //     debugger;
            // });

            this.getView().bindElement({
                path: "salesService>"+"/ManageReqSet(Zreqn='"+sId+"',Zsevbp='"+sEmpId+"')",
                events: {
                    //change: this._onBindingChange.bind(this),
                    dataRequested: function () {
                        // debugger;
                    },
                    dataReceived: function (oResp) {
                        // debugger;
                    }
                }
            });

            // this.getModel("vendorService").bindContext("/bpvend(Rootid=005056ac-e463-1edd-b3aa-4ed4dafa9d23,IsActiveEntity=true)");
			// this.getView().bindElement({
			// 	path: sObjectPath
			// });
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
