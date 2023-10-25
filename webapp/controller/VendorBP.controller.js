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

    return BaseController.extend("com.ncs.btp.buildinbox.controller.VendorBP", {

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
            this.getRouter().getRoute("vendor").attachPatternMatched(this._onObjectMatched, this);
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

        _setModels: function () {
            let oCommentsModel = new JSONModel({
                comments: ""
            });
            this.setModel(oCommentsModel, "commentsModel");

            let oFinModel = new JSONModel({
                ReconAcc: "",
                PaymentReason: "",
                Customer: "",
                ClearingWcust: ""
            });
            this.setModel(oFinModel, "finModel");

        },

        _setViewSettings: function () {
            //isFinalApprover is based on TaskDefinitionID

            let oTaskDetails = this.getModel("TaskDetails").getData();
            this.getModel("objectView").setProperty("/isFinalApprover", oTaskDetails.activityId === "form_financeDepartmentApprover_1");
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
                    let isFinalAppprover = this.getModel("objectView").getData().isFinalApprover;
                    let sMessage = "Task completed successfully";
                    if (isFinalAppprover) {
                        debugger;
                        //sap.m.MessageBox.information("Vendor Business Partner created successfully: "+data.BusinessPartner);
                        sMessage = "Vendor Business Partner created successfully: " + data.BusinessPartner;
                        // sap.m.MessageBox.information("Vendor Business Partner created successfully: "+data.BusinessPartner, {
                        //     actions: [MessageBox.Action.OK],
                        //     emphasizedAction: MessageBox.Action.OK,
                        //     onClose: function (sAction) {
                        //         that.navToMainPage();
                        //     }
                        // });
                    }

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

        updateService: function (status) {
            let oBAPIModel = this.getModel("BAPIService");
            let oTaskContext = this.getModel("TaskContextData").getData();
            let oComments = this.getModel("commentsModel").getData();

            let isFinalAppprover = this.getModel("objectView").getData().isFinalApprover;
            let oPayload = {};
            if (isFinalAppprover) {
                //update finance data
                oPayload = this.getModel("finModel").getData();
            }

            oPayload.ParentId = oTaskContext.Id;
            oPayload.IsFinalApprover = isFinalAppprover;
            oPayload.ApprovalRemark = oComments.comments;
            oPayload.HeaderStat = status;

            return new Promise(function (resolve, reject) {
                oBAPIModel.create("/FinanceDataSet", oPayload, {
                    success: function (data) {
                        console.log('updated comments');
                        resolve(data);
                    }
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
            let oFuncSuccess = function (data) {
                orderBusyDialog.close();


            }.bind(this);

            let oFuncError = function (data) {
                orderBusyDialog.close();
                sap.m.MessageBox.error("Error occurred! \n" + data);
            };

            this.onRejectConfirm().then(function (data) {
                this.completeTask(sPath, oPayload).then(oFuncSuccess, oFuncError);
            }.bind(this));

        },

        onRejectConfirm: function () {

            //check the comments present
            let oComments = this.getModel("commentsModel").getData();
            return new Promise(function (resolve, reject) {
                if (oComments.comments === '') {
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
                }
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
                let oContextData = oDefModel.getData().startEvent.input;
                this.setModel(new sap.ui.model.json.JSONModel(JSON.parse(JSON.stringify(oContextData))), "TaskContextData");
                console.log("context data: " + JSON.stringify(oContextData));

                this.getVendorDetails(oContextData.Id);


            }.bind(this));



        },

        getVendorDetails: function (sId) {

            // let oBindContext = this.getModel("vendorService").bindContext("/bpvend(Rootid="+sId+",IsActiveEntity=true)"); 
            // let oReqProm = oBindContext.requestObject(); 
            // oReqProm.then(function(oResp){
            //     console.log(oResp);
            //     debugger;
            // });

            this.getView().bindElement({
                path: "vendorService>" + "/bpvend(Rootid='" + sId + "',IsActiveEntity=true)",
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

            let sPath = this.getModulePath() + "/bpmworkflowruntime/public/workflow/rest/v1/task-instances/" + sTaskInstanceId;

            let oDefModel = new sap.ui.model.json.JSONModel();
            oDefModel.loadData(
                sPath, null, false, 'GET'
            );

            this.setModel(oDefModel, "TaskDetails");

            // return oDefModel.getData();
        },

        onValueHelpRequested: function () {
            this._oBasicSearchField = new SearchField();
            if (!this.pDialog) {
                this.pDialog = this.loadFragment({
                    name: "com.ncs.btp.buildinbox.fragment.CustomerVH"
                });
            }
            this.pDialog.then(function (oDialog) {
                // var oFilterBar = oDialog.getFilterBar();
                this._oVHD = oDialog;
                // Initialise the dialog with model only the first time. Then only open it
                if (this._bDialogInitialized) {
                    // Re-set the tokens from the input and update the table
                    // oDialog.setTokens([]);
                    // oDialog.setTokens(this._oMultiInput.getTokens());
                    // oDialog.update();

                    oDialog.open();
                    return;
                }
                this.getView().addDependent(oDialog);

                // Set key fields for filtering in the Define Conditions Tab
                // oDialog.setRangeKeyFields([{
                // 	label: "Product",
                // 	key: "ProductCode",
                // 	type: "string",
                // 	typeInstance: new TypeString({}, {
                // 		maxLength: 7
                // 	})
                // }]);

                // Set Basic Search for FilterBar
                // oFilterBar.setFilterBarExpanded(false);
                // oFilterBar.setBasicSearch(this._oBasicSearchField);

                // Trigger filter bar search when the basic search is fired
                this._oBasicSearchField.attachSearch(function () {
                    oFilterBar.search();
                });

                oDialog.getTableAsync().then(function (oTable) {

                    // oTable.setModel(this.oProductsModel);

                    // For Desktop and tabled the default table is sap.ui.table.Table
                    if (oTable.bindRows) {
                        // Bind rows to the ODataModel and add columns
                        oTable.bindAggregation("rows", {
                            path: "BAPIService>/CustomerVHSet",
                            events: {
                                dataReceived: function () {
                                    oDialog.update();
                                }
                            }
                        });
                        oTable.addColumn(new UIColumn({ label: "Customer Code", template: "BAPIService>KUNNR" }));
                        oTable.addColumn(new UIColumn({ label: "Customer Name", template: "BAPIService>Name1" }));
                    }

                    // For Mobile the default table is sap.m.Table
                    if (oTable.bindItems) {
                        // Bind items to the ODataModel and add columns
                        oTable.bindAggregation("items", {
                            path: "/CustomerVHSet",
                            template: new ColumnListItem({
                                cells: [new Label({ text: "{BAPIService>KUNNR}" }), new Label({ text: "{BAPIService>Name1}" })]
                            }),
                            events: {
                                dataReceived: function () {
                                    oDialog.update();
                                }
                            }
                        });
                        oTable.addColumn(new MColumn({ header: new Label({ text: "Customer Code" }) }));
                        oTable.addColumn(new MColumn({ header: new Label({ text: "Customer Name" }) }));
                    }
                    oDialog.update();
                }.bind(this));

                // oDialog.setTokens(this._oMultiInput.getTokens());

                // set flag that the dialog is initialized
                this._bDialogInitialized = true;
                oDialog.open();
            }.bind(this));
        },
        onValueHelpOkPress: function (oEvent) {
            var aTokens = oEvent.getParameter("tokens");
            this._oMultiInput.setValue(aTokens[0].getKey());
            this._oVHD.close();
        },

        onValueHelpCancelPress: function () {
            this._oVHD.close();
        },

        ////////////////////


        onValueHelpRequestedRA: function () {

            this._oBasicSearchFieldRA = new SearchField();
            if (!this.pDialogRA) {
                this.pDialogRA = this.loadFragment({
                    name: "com.ncs.btp.buildinbox.fragment.RecAccountVH"
                });
            }
            this.pDialogRA.then(function (oDialog) {
                // var oFilterBar = oDialog.getFilterBar();
                this._oVHDRA = oDialog;
                // Initialise the dialog with model only the first time. Then only open it
                if (this._bDialogInitializedRA) {
                    oDialog.open();
                    return;
                }
                this.getView().addDependent(oDialog);

                // Trigger filter bar search when the basic search is fired
                this._oBasicSearchFieldRA.attachSearch(function () {
                    oFilterBar.search();
                });

                oDialog.getTableAsync().then(function (oTable) {

                    // oTable.setModel(this.oProductsModel);

                    // For Desktop and tabled the default table is sap.ui.table.Table
                    if (oTable.bindRows) {
                        // Bind rows to the ODataModel and add columns
                        oTable.bindAggregation("rows", {
                            path: "BAPIService>/ReconciliationAccVHSet",
                            events: {
                                dataReceived: function () {
                                    oDialog.update();
                                }
                            }
                        });
                        oTable.addColumn(new UIColumn({ label: "Customer Code", template: "BAPIService>ComapanyCode" }));
                        oTable.addColumn(new UIColumn({ label: "GL Account", template: "BAPIService>GLAccount" }));
                    }

                    // For Mobile the default table is sap.m.Table
                    if (oTable.bindItems) {
                        // Bind items to the ODataModel and add columns
                        oTable.bindAggregation("items", {
                            path: "/ReconciliationAccVHSet",
                            template: new ColumnListItem({
                                cells: [new Label({ text: "{BAPIService>ComapanyCode}" }), new Label({ text: "{BAPIService>GLAccount}" })]
                            }),
                            events: {
                                dataReceived: function () {
                                    oDialog.update();
                                }
                            }
                        });
                        oTable.addColumn(new MColumn({ header: new Label({ text: "Company Code" }) }));
                        oTable.addColumn(new MColumn({ header: new Label({ text: "GL Account" }) }));
                    }
                    oDialog.update();
                }.bind(this));


                // set flag that the dialog is initialized
                this._bDialogInitializedRA = true;
                oDialog.open();
            }.bind(this));
        },
        onValueHelpOkPressRA: function (oEvent) {
            var aTokens = oEvent.getParameter("tokens");
            this._oMultiInputRA.setValue(aTokens[0].getKey());
            this._oVHDRA.close();
        },

        onValueHelpCancelPressRA: function () {
            this._oVHDRA.close();
        }
    });

});
