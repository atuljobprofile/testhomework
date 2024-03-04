declare interface ICandidateQuizWebPartStrings {
  PropertyPaneDescription: string;
  BasicGroupName: string;
  ListCreationText: string;
  PlaceholderIconText: string;
  PlaceholderDescription: string;
  PlaceholderButtonLabel: string;
  QuestionLoadingText: string;
  SubmissionLoadingText: string;
  PlsWait: string;
  QuizDateLabel: string;
  QuizDateCalloutText: string;
  QuizQuestionsLabel: string;
  QuizQuestionsPanelHeader: string;
  QuizQuestionsManageButton: string;
  MsgAfterSubmissionLabel: string;
  MsgAfterSubmissionDescription: string;
  MsgAfterSubmissionPlaceholder: string;
  ResponseMsgToUserLabel: string;
  ResponseMsgToUserDescription: string;
  ResponseMsgToUserPlaceholder: string;
  DefaultResponseMsgToUser: string;
  SuccessfullVoteSubmission: string;
  FailedVoteSubmission: string;
  BtnSumbitVote: string;
  BtnSumbitVoteLabel: string;
  BtnSumbitVoteDescription: string;
  BtnSumbitVotePlaceholder: string;
  SubmitValidationMessage: string;
  ChartFieldLabel: string;
  ChartFieldCalloutText:string;
  NoQuizMsgLabel: string;
  NoQuizMsgDescription: string;
  NoQuizMsgPlaceholder: string;
  NoQuizMsgDefault: string;

  Q_Title_Title: string;
  Q_Title_Placeholder: string;
  Q_Options_Title: string;
  Q_Options_Placeholder: string;
  MultiChoice_Title: string;
  Q_StartDate_Title: string;
  Q_EndDate_Title: string;
}

declare module 'CandidateQuizWebPartStrings' {
  const strings: ICandidateQuizWebPartStrings;
  export = strings;
}
