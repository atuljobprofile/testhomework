import { IUserInfo } from "../../../Models";
import { ChartType } from "@pnp/spfx-controls-react/lib/ChartControl";

export interface ICandidateQuizProps {
  pollQuestions: any[];
  SuccessfullVoteSubmissionMsg: string;
  ResponseMsgToUser: string;
  BtnSubmitVoteText: string;
  chartType: ChartType;
  pollBasedOnDate: boolean;
  currentUserInfo: IUserInfo;
  NoCandidateQuizMsg: string;
  openPropertyPane: () => void;
}
