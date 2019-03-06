import { TeamMembersModel } from "./TeamMembersModel";
import { ActiveCircleModel } from "./ActiveCircleModel";
import { JournalModel } from "./JournalModel";
import { SpiritModel } from "./SpiritModel";
import {DataModelFactory} from "./DataModelFactory";

//
// this class is used to manage DataClient requests for Stores
//
export class ModelCoordinator {

  constructor(scope) {
    this.name = this.constructor.name;
    this.scope = scope;
  }

  wireModelsTogether = () => {
    this.journalModel = DataModelFactory.createModel(DataModelFactory.Models.JOURNAL, this);
    this.teamModel = DataModelFactory.createModel(DataModelFactory.Models.MEMBER_STATUS, this);
    this.spiritModel = DataModelFactory.createModel(DataModelFactory.Models.SPIRIT, this);
    this.activeCircle = DataModelFactory.createModel(DataModelFactory.Models.ACTIVE_CIRCLE, this);

    this.spiritModel.setDependentModel(this.teamModel);
    this.activeCircle.setDependentModel(this.teamModel);

    //event wirings

    this.onActiveCircleUpdateMe();
    this.onJournalEntryUpdateMeAndXP();
    this.onJournalUpdateResetSpiritFlame();

    this.onChangeActiveRowResetSpiritFlame();
    this.onTeamMemberChangeActiveScopeForAllModels();

    this.onWTFTimerUpdateRefreshTeamMemberTimers();

    //TODO refactor this one out
    //    this.onDirtySpiritFlameUpdateActiveRow();

  };

  unregisterModelWirings = () => {
     this.journalModel.unregisterAllListeners(this.name);
    this.teamModel.unregisterAllListeners(this.name);
    this.spiritModel.unregisterAllListeners(this.name);
    this.activeCircle.unregisterAllListeners(this.name);
  };

  onActiveCircleUpdateMe() {
     this.activeCircle.registerListener(this.name, ActiveCircleModel.CallbackEvent.CIRCLE_UPDATE,
       () => {
          console.log("ModelCoordinator Event Fired: onActiveCircleUpdateMe");
          this.teamModel.refreshMe();
       });
  }

  onJournalEntryUpdateMeAndXP() {
    this.journalModel.registerListener(this.name, JournalModel.CallbackEvent.NEW_JOURNAL_ITEM_ADDED,
      () => {
          console.log("ModelCoordinator Event Fired: onJournalEntryUpdateMeAndXP");


          this.teamModel.refreshMe();
          this.spiritModel.refreshXP();
      });
  }

  onJournalUpdateResetSpiritFlame() {
    this.journalModel.registerListener(this.name, JournalModel.CallbackEvent.JOURNAL_HISTORY_UPDATE,
      () => {
        console.log("ModelCoordinator Event Fired: onJournalUpdateResetSpiritFlame");

        if (this.journalModel.getActiveScope().activeJournalItem != null) {
          let activeFlame = this.journalModel.getActiveScope().activeJournalItem.flameRating;
          this.spiritModel.resetFlame(activeFlame);
        }
      });
  }

  onChangeActiveRowResetSpiritFlame() {
     this.journalModel.registerListener(this.name, JournalModel.CallbackEvent.ACTIVE_ITEM_UPDATE,
       () => {
          console.log("ModelCoordinator Event Fired: onChangeActiveRowResetSpiritFlame");

         if (this.journalModel.getActiveScope().activeJournalItem != null) {
           let activeFlame = this.journalModel.getActiveScope().activeJournalItem.flameRating;
           this.spiritModel.resetFlame(activeFlame);
         }
       });
  }

  onTeamMemberChangeActiveScopeForAllModels() {
     this.teamModel.registerListener(this.name, TeamMembersModel.CallbackEvent.ACTIVE_MEMBER_UPDATE,
       () => {
         console.log("ModelCoordinator Event Fired: onTeamMemberChangeActiveScopeForAllModels");
         this.journalModel.setMemberSelection(
           this.teamModel.me.id,
           this.teamModel.activeTeamMember.id
         );

         this.spiritModel.setMemberSelection(
           this.teamModel.me.id,
           this.teamModel.activeTeamMember.id
         );

         this.activeCircle.setMemberSelection(
           this.teamModel.me.id,
           this.teamModel.activeTeamMember.id
         );
       });

  }

  onWTFTimerUpdateRefreshTeamMemberTimers() {
    this.activeCircle.registerListener(this.name,
      ActiveCircleModel.CallbackEvent.WTF_TIMER_MINUTES_UPDATE,
      () => {
        console.log("ModelCoordinator Event Fired: onWTFTimerUpdateRefreshTeamMemberTimers");
        this.teamModel.refreshMe();
      }
    );

  }



}
