import * as React from 'react';
import styles from './CandidateQuiz.module.scss';
import * as strings from 'CandidateQuizWebPartStrings';
import { Placeholder } from "@pnp/spfx-controls-react/lib/Placeholder";
import { ProgressIndicator } from 'office-ui-fabric-react/lib/ProgressIndicator';
import { PrimaryButton } from 'office-ui-fabric-react/lib/Button';
import { ICandidateQuizProps } from './ICandidateQuizProps';
import { ICandidateQuizState } from './ICandidateQuizState';
import OptionsContainer from './OptionsContainer/OptionsContainer';
import MessageContainer from './MessageContainer/MessageContainer';
import QuickQuizChart from './ChartContainer/QuickQuizChart';
import { IQuestionDetails, IResponseDetails, IQuizAnalyticsInfo } from '../../../Models';
import SPHelper from '../../../Common/SPHelper';
import { MessageScope } from '../../../Common/enumHelper';
import * as _ from 'lodash';
import * as moment from 'moment';

export default class CandidateQuiz extends React.Component<ICandidateQuizProps, ICandidateQuizState> {
  private helper: SPHelper = null;
  private disQuestionId: string;
  private displayQuestion: IQuestionDetails;
  constructor(props: ICandidateQuizProps) {
    super(props);
    this.state = {
      listExists: false,
      QuizQuestions: [],
      UserResponse: [],
      displayQuestionId: "",
      displayQuestion: null,
      enableSubmit: true,
      enableChoices: true,
      showOptions: false,
      showProgress: false,
      showChart: false,
      showChartProgress: false,
      QuizAnalytics: undefined,
      showMessage: false,
      isError: false,
      MsgContent: "",
      showSubmissionProgress: false,
      currentQuizResponse: ""
    };
    this.helper = new SPHelper();
  }

  public componentDidMount = () => {
    this.checkAndCreateList();
  }

  public componentDidUpdate = (prevProps: ICandidateQuizProps) => {
    if (prevProps.QuizQuestions !== this.props.QuizQuestions || prevProps.QuizBasedOnDate !== this.props.QuizBasedOnDate) {
      this.setState({
        UserResponse: [],
        displayQuestion: null,
        displayQuestionId: ''
      }, () => {
        this.getQuestions(this.props.QuizQuestions);
      });
    }
    if (prevProps.chartType !== this.props.chartType) {
      let newQuizAnalytics: IQuizAnalyticsInfo = this.state.QuizAnalytics;
      newQuizAnalytics.ChartType = this.props.chartType;
      this.setState({
        QuizAnalytics: newQuizAnalytics
      }, this.bindResponseAnalytics);
    }
  }

  private async checkAndCreateList() {
    this.helper = new SPHelper();
    let listCreated = await this.helper.checkListExists();
    if (listCreated) {
      this.setState({ listExists: true }, () => {
        this.getQuestions();
      });
    }
  }

  private getQuestions = (questions?: any[]) => {
    let pquestions: IQuestionDetails[] = [];
    let tmpQuestions: any[] = (questions) ? questions : (this.props.QuizQuestions) ? this.props.QuizQuestions : [];
    if (tmpQuestions && tmpQuestions.length > 0) {
      tmpQuestions.map((question) => {
        pquestions.push({
          Id: question.uniqueId,
          DisplayName: question.QTitle,
          Choices: question.QOptions,
          UseDate: question.QUseDate,
          StartDate: new Date(question.QStartDate),
          EndDate: new Date(question.QEndDate),
          MultiChoice: question.QMultiChoice,
          SortIdx: question.sortIdx
        });
      });
    }
    this.disQuestionId = this.getDisplayQuestionID(pquestions);
    this.setState({ QuizQuestions: pquestions, displayQuestionId: this.disQuestionId, displayQuestion: this.displayQuestion }, this.bindQuizs);
  }

  private getDisplayQuestionID = (questions?: any[]) => {
    let filQuestions: any[] = [];
    if (questions.length > 0) {
      if (this.props.QuizBasedOnDate) {
        filQuestions = _.filter(questions, (o) => { return moment().startOf('date') >= moment(o.StartDate) && moment(o.EndDate) >= moment().startOf('date'); });
      } else {
        filQuestions = _.orderBy(questions, ['SortIdx'], ['asc']);
        this.displayQuestion = filQuestions[0];
        return filQuestions[0].Id;
      }
      if (filQuestions.length > 0) {
        filQuestions = _.orderBy(filQuestions, ['SortIdx'], ['asc']);
        this.displayQuestion = filQuestions[0];
        return filQuestions[0].Id;
      } else {
        this.displayQuestion = null;
      }
    }
    return '';
  }

  private bindQuizs = () => {
    this.setState({
      showProgress: (this.state.QuizQuestions.length > 0) ? true : false,
      enableSubmit: true,
      enableChoices: true,
      showOptions: false,
      showChart: false,
      showChartProgress: false,
      QuizAnalytics: undefined,
      showMessage: false,
      isError: false,
      MsgContent: "",
      showSubmissionProgress: false
    }, this.getAllUsersResponse);
  }

  private _onChange = (ev: any, option: any, isMultiSel: boolean): void => {
    let prevUserResponse = this.state.UserResponse;
    let userresponse: IResponseDetails;
    userresponse = {
      QuizQuestionId: this.state.displayQuestion.Id,
      QuizQuestion: this.state.displayQuestion.DisplayName,
      QuizResponse: !isMultiSel ? option.key : '',
      UserID: this.props.currentUserInfo.ID,
      UserDisplayName: this.props.currentUserInfo.DisplayName,
      UserLoginName: this.props.currentUserInfo.LoginName,
      QuizMultiResponse: isMultiSel ? option.key : [],
      IsMulti: isMultiSel
    };
    if (prevUserResponse.length > 0) {
      let filRes = this.getUserResponse(prevUserResponse);
      if (filRes.length > 0) {
        !isMultiSel ? filRes[0].QuizResponse = option.key : filRes[0].QuizMultiResponse = option.key;
      } else {
        prevUserResponse.push(userresponse);
      }
    } else {
      prevUserResponse.push(userresponse);
    }
    this.setState({
      ...this.state,
      UserResponse: prevUserResponse
    });
  }

  private _getSelectedKey = (): string => {
    let selKey: string = "";
    if (this.state.UserResponse && this.state.UserResponse.length > 0) {
      var userResponses = this.state.UserResponse;
      var userRes = this.getUserResponse(userResponses);
      if (userRes.length > 0) {
        selKey = userRes[0].QuizResponse;
      }
    }
    return selKey;
  }

  private _submitVote = async () => {
    this.setState({
      ...this.state,
      enableSubmit: false,
      enableChoices: false,
      showSubmissionProgress: false,
      isError: false,
      MsgContent: '',
      showMessage: false
    });
    var curUserRes = this.getUserResponse(this.state.UserResponse);
    if (curUserRes.length <= 0) {
      this.setState({
        MsgContent: strings.SubmitValidationMessage,
        isError: true,
        showMessage: true,
        enableSubmit: true,
        enableChoices: true,
      });
    } else {
      this.setState({
        ...this.state,
        enableSubmit: false,
        enableChoices: false,
        showSubmissionProgress: true,
        isError: false,
        MsgContent: '',
        showMessage: false
      });
      try {
        await this.helper.submitResponse(curUserRes[0]);
        this.setState({
          ...this.state,
          showSubmissionProgress: false,
          showMessage: true,
          isError: false,
          MsgContent: (this.props.SuccessfullVoteSubmissionMsg && this.props.SuccessfullVoteSubmissionMsg.trim()) ?
            this.props.SuccessfullVoteSubmissionMsg.trim() : strings.SuccessfullVoteSubmission,
          showChartProgress: true
        }, this.getAllUsersResponse);
      } catch (err) {
        console.log(err);
        this.setState({
          ...this.state,
          enableSubmit: true,
          enableChoices: true,
          showSubmissionProgress: false,
          showMessage: true,
          isError: true,
          MsgContent: strings.FailedVoteSubmission
        });
      }
    }
  }

  private getAllUsersResponse = async () => {
    let usersResponse = await this.helper.getQuizResponse((this.state.displayQuestionId) ? this.state.displayQuestionId : this.disQuestionId);
    var filRes = _.filter(usersResponse, (o) => { return o.UserID == this.props.currentUserInfo.ID; });
    if (filRes.length > 0) {
      this.setState({
        showChartProgress: true,
        showChart: true,
        showOptions: false,
        showProgress: false,
        UserResponse: usersResponse,
        currentQuizResponse: filRes[0].Response ? filRes[0].Response : filRes[0].MultiResponse.join(',')
      }, this.bindResponseAnalytics);
    } else {
      this.setState({
        showProgress: false,
        showOptions: true,
        showChartProgress: false,
        showChart: false
      });
    }
  }

  private bindResponseAnalytics = () => {
    const { QuizQuestions, displayQuestion } = this.state;
    let tmpUserResponse: any = this.state.UserResponse;
    if (tmpUserResponse && tmpUserResponse.length > 0) {
      var tempData: any;
      let qChoices: string[] = displayQuestion.Choices.split(',');
      var finalData = [];
      if (!displayQuestion.MultiChoice) {
        tempData = _.countBy(tmpUserResponse, 'Response');
      } else {
        var data = [];
        tmpUserResponse.map((res: any) => {
          if (res.MultiResponse && res.MultiResponse.length > 0) {
            res.MultiResponse.map((finres: any) => {
              data.push({
                "UserID": res.UserID,
                "Response": finres.trim()
              });
            });
          }
        });
        tempData = _.countBy(data, 'Response');
      }
      qChoices.map((label) => {
        if (tempData[label.trim()] == undefined) {
          finalData.push(0);
        } else finalData.push(tempData[label.trim()]);
      });
      var QuizAnalytics: IQuizAnalyticsInfo;
      QuizAnalytics = {
        ChartType: this.props.chartType,
        Labels: qChoices,
        Question: displayQuestion.DisplayName,
        QuizResponse: finalData
      };
      this.setState({
        showProgress: false,
        showOptions: false,
        showChartProgress: false,
        showChart: true,
        QuizAnalytics: QuizAnalytics
      });
    }
  }

  private getUserResponse(UserResponses: IResponseDetails[]): IResponseDetails[] {
    let retUserResponse: IResponseDetails[];
    retUserResponse = UserResponses.filter((res) => { return res.UserID == this.props.currentUserInfo.ID; });
    return retUserResponse;
  }

  public render(): React.ReactElement<ICandidateQuizProps> {
    const { QuizQuestions, BtnSubmitVoteText, ResponseMsgToUser, NoQuizMsg } = this.props;
    const { showProgress, enableChoices, showSubmissionProgress, showChartProgress, QuizQuestions, showMessage, MsgContent, isError,
      showOptions, showChart, QuizAnalytics, currentQuizResponse, enableSubmit, listExists, displayQuestion } = this.state;
    const showConfig: boolean = (!QuizQuestions || QuizQuestions.length <= 0 && (!QuizQuestions || QuizQuestions.length <= 0)) ? true : false;
    let userResponseCaption: string = (ResponseMsgToUser && ResponseMsgToUser.trim()) ? ResponseMsgToUser.trim() : strings.DefaultResponseMsgToUser;
    let submitButtonText: string = (BtnSubmitVoteText && BtnSubmitVoteText.trim()) ? BtnSubmitVoteText.trim() : strings.BtnSumbitVote;
    let noQuizmsg: string = (NoQuizMsg && NoQuizMsg.trim()) ? NoQuizMsg.trim() : strings.NoQuizMsgDefault;
    return (
      <div className={styles.CandidateQuiz}>
        {!listExists ? (
          <ProgressIndicator label={strings.ListCreationText} description={strings.PlsWait} />
        ) : (
            <>
              {showConfig &&
                <Placeholder iconName='Edit'
                  iconText={strings.PlaceholderIconText}
                  description={strings.PlaceholderDescription}
                  buttonLabel={strings.PlaceholderButtonLabel}
                  onConfigure={this.props.openPropertyPane} />
              }
              {showProgress && !showChart &&
                <ProgressIndicator label={strings.QuestionLoadingText} description={strings.PlsWait} />
              }
              {!displayQuestion && !showConfig &&
                <MessageContainer MessageScope={MessageScope.Info} Message={noQuizmsg} />
              }
              {QuizQuestions && QuizQuestions.length > 0 && showOptions && displayQuestion &&
                <div className="ms-Grid" dir="ltr">
                  <div className="ms-Grid-row">
                    <div className="ms-Grid-col ms-lg12 ms-md12 ms-sm12">
                      <div className="ms-textAlignLeft ms-font-m-plus ms-fontWeight-semibold">
                        {displayQuestion.DisplayName}
                      </div>
                    </div>
                  </div>
                  <div className="ms-Grid-row">
                    <div className="ms-Grid-col ms-lg12 ms-md12 ms-sm12">
                      <div className="ms-textAlignLeft ms-font-m-plus ms-fontWeight-semibold">
                        <OptionsContainer disabled={!enableChoices} multiSelect={displayQuestion.MultiChoice}
                          selectedKey={this._getSelectedKey}
                          options={displayQuestion.Choices}
                          label="Pick One"
                          onChange={this._onChange}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="ms-Grid-row">
                    <div className="ms-Grid-col ms-lg12 ms-md12 ms-sm12">
                      <div className="ms-textAlignCenter ms-font-m-plus ms-fontWeight-semibold">
                        <PrimaryButton disabled={!enableSubmit} text={submitButtonText}
                          onClick={this._submitVote.bind(this)} />
                      </div>
                    </div>
                  </div>
                  {showSubmissionProgress && !showChartProgress &&
                    <ProgressIndicator label={strings.SubmissionLoadingText} description={strings.PlsWait} />
                  }
                </div>
              }
              {showMessage && MsgContent &&
                <MessageContainer MessageScope={(isError) ? MessageScope.Failure : MessageScope.Success} Message={MsgContent} />
              }
              {showChartProgress && !showChart &&
                <ProgressIndicator label="Loading the Quiz analytics" description="Getting all the responses..." />
              }
              {showChart &&
                <>
                  <QuickQuizChart QuizAnalytics={QuizAnalytics} />
                  <MessageContainer MessageScope={MessageScope.Info} Message={`${userResponseCaption}: ${currentQuizResponse}`} />
                </>
              }
            </>
          )
        }
      </div>
    );
  }
}