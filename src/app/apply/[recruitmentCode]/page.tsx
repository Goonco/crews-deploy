import { useQuery } from '@tanstack/react-query';
import { Navigate, useParams } from 'react-router-dom';

import Container from '../../../components/shared/container';
import useApplicantApi from '../../../apis/applicant-api';
import handleError from '../../../lib/utils/error';
import Loading from '../../../components/shared/loading';
import { readRecruitmentByCode } from '../../../apis/base-api';
import ApplySectionBox from './_components/apply-section-box';
import ApplyNarrativeBox from './_components/apply-narrative-box';
import ApplySelectiveBox from './_components/apply-selective-box';
import { QuestionType } from '../../../lib/enums';
import { IQuestion } from '../../../lib/model/i-section';
import HeaderSection from './_components/header-section';
import { FormProvider, useForm } from 'react-hook-form';
import { useEffect } from 'react';
import {
  IAnswer,
  ICreatedApplication,
  INarrativeAnswer,
  ISelectiveAnswer,
} from '../../../lib/model/i-application';

const untouchedFieldIndex = {
  name: 0,
  studentNumber: 1,
  major: 2,
};

export interface IFormApplication {
  id: number | null;
  studentNumber: string;
  major: string;
  name: string;
  answers: IFormAnswer[]; // answers 배열은 여러 답변 타입을 포함
}

type IFormAnswer = {
  answerId: number | null;
  content: string | null;
  choiceIds: number[] | null;
  questionId: number;
  questionType: 'SELECTIVE' | 'NARRATIVE';
};

const defaultApplication: IFormApplication = {
  id: null,
  studentNumber: '00000000',
  name: 'DEFAULT_NAME',
  major: 'DEFAULT_MAJOR',
  answers: [],
};

const Page = () => {
  const { recruitmentCode } = useParams<{ recruitmentCode: string }>();

  const { readApplication } = useApplicantApi(recruitmentCode!);

  const methods = useForm<IFormApplication>({
    defaultValues: defaultApplication,
  });

  const name = methods.watch(`answers.${untouchedFieldIndex.name}.content`);
  const major = methods.watch(`answers.${untouchedFieldIndex.major}.content`);
  const studentNumber = methods.watch(
    `answers.${untouchedFieldIndex.studentNumber}.content`,
  );

  const onSubmit = (data: IFormApplication) => {
    const body = {
      studentNumber: studentNumber,
      name: name,
      major: major,
      answers: data.answers,
    };

    console.log('Submitted Data:', data);
  };

  const { data: recruitment, ...recruitmentQuery } = useQuery({
    queryKey: ['recruitmentByCode'],
    queryFn: () => readRecruitmentByCode(recruitmentCode!),
    enabled: !!recruitmentCode,
  });

  /** 저장된 값 없을 시 default로 set 하도록 에러 핸들링 */
  const { data: application, ...applicationQuery } = useQuery({
    queryKey: ['readApplication', recruitmentCode],
    queryFn: () => readApplication(),
    enabled: !!recruitmentCode,
  });

  useEffect(() => {
    if (application) {
      const formAnswers: IFormAnswer[] = application.answers.reduce(
        (acc: IFormAnswer[], answer: IAnswer) => {
          if (answer.questionType === 'NARRATIVE') {
            // NARRATIVE 타입의 답변 변환
            const narrativeAnswer: IFormAnswer = {
              answerId: answer.answerId,
              content: (answer as INarrativeAnswer).content,
              choiceIds: null,
              questionId: answer.questionId,
              questionType: 'NARRATIVE',
            };
            acc.push(narrativeAnswer);
          } else if (answer.questionType === 'SELECTIVE') {
            // SELECTIVE 타입의 답변 변환 및 그룹화
            const selectiveAnswerIndex = acc.findIndex(
              (fa) =>
                fa.questionId === answer.questionId &&
                fa.questionType === 'SELECTIVE',
            );

            if (selectiveAnswerIndex !== -1) {
              // 이미 존재하는 SELECTIVE 답변에 choiceId 추가
              acc[selectiveAnswerIndex].choiceIds?.push(
                (answer as ISelectiveAnswer).choiceId,
              );
            } else {
              // 새로운 SELECTIVE 답변 생성
              const selectiveAnswer: IFormAnswer = {
                answerId: answer.answerId,
                content: null,
                choiceIds: [(answer as ISelectiveAnswer).choiceId],
                questionId: answer.questionId,
                questionType: 'SELECTIVE',
              };
              acc.push(selectiveAnswer);
            }
          }
          return acc;
        },
        [] as IFormAnswer[], // 초기값을 빈 배열로 설정
      );

      //TODO: check converted formAnswers
      console.log(formAnswers);

      methods.reset({
        id: application.id,
        studentNumber: application.studentNumber,
        name: application.name,
        major: application.major,
        answers: formAnswers,
      });
    }
  }, [application, methods]);

  if (applicationQuery.isFetching || recruitmentQuery.isFetching)
    return <Loading />;
  else if (recruitmentQuery.error || !recruitment) {
    handleError(recruitmentQuery.error, 'readRecruitmentByCode');
    return <Navigate to="/error" replace />;
  } else if (applicationQuery.isError) {
    handleError(applicationQuery.error, 'readApplication');

    return <Navigate to="/error" replace />;
  }

  return (
    <FormProvider {...methods}>
      <Container className="mx-auto w-[630px]">
        <div className="flex flex-col gap-[1.5rem] py-24">
          <HeaderSection />
          <form onSubmit={methods.handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-[1.5rem]">
              {recruitment.sections.map((section) => (
                <ApplySectionBox
                  name={section.name}
                  description={section.description}
                >
                  <div className="flex flex-col gap-[1.5rem]">
                    {section.questions.map((question) => (
                      <RenderQuestion key={question.id} question={question} />
                    ))}
                  </div>
                </ApplySectionBox>
              ))}
            </div>
            <button
              type="submit"
              className="rounded-[0.625rem] bg-crews-bk01 py-2 text-crews-w01"
            >
              제출하기
            </button>
          </form>
        </div>
      </Container>
    </FormProvider>
  );
};

// 질문 타입별 확장성을 위한 컴포넌트 렌더링
const RenderQuestion = ({ question }: { question: IQuestion }) => {
  switch (question.type) {
    case QuestionType.NARRATIVE:
      return <ApplyNarrativeBox question={question} />;
    case QuestionType.SELECTIVE:
      return <ApplySelectiveBox key={question.id} question={question} />;
    default:
      return null;
  }
};

export default Page;
