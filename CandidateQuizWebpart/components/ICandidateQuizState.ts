import { IQuestionDetails, IResponseDetails } from "../../../Models";

export interface ICandidateQuizState {
	listExists: boolean;
	CandidateQuizQuestions: IQuestionDetails[];
	UserResponse: IResponseDetails[];
	displayQuestionId: string;
	displayQuestion: IQuestionDetails;
	enableSubmit: boolean;
	enableChoices: boolean;
	showOptions: boolean;
	showProgress: boolean;
	showChart: boolean;
	showChartProgress: boolean;
	showMessage: boolean;
	isError: boolean;
	MsgContent: string;
	CandidateQuizAnalytics: any; //IPollAnalyticsInfo;
	showSubmissionProgress: boolean;
	currentCandidateQuizResponse: string;
}