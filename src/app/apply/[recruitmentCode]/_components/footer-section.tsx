import { useEffect, useState } from 'react';
import { Button } from '../../../../components/shadcn/button.tsx';
import CrewsFooter from '../../../../components/molecule/crews-footer.tsx';
import { useToast } from '../../../../hooks/use-toast.ts';
import { ISaveApplication } from '../../../../lib/schemas/application-schema.ts';
import {
  convertToFormApplication,
  convertToSaveApplication,
  filterSelectedAnswer,
} from '../_utils/utils.ts';
import { IFormApplication, SHARED_SECTION_INDEX } from '../page.tsx';
import { z } from 'zod';
import {
  DeadlineSchema,
  RecruitmentSchema,
} from '../../../../lib/schemas/recruitment-schema.ts';
import { useFormContext } from 'react-hook-form';
import useApplicantApi from '../../../../apis/applicant-api.ts';
import { useParams } from 'react-router-dom';
import { ReadApplicationResponseSchema } from '../../../../apis/response-body-schema.ts';
import { printCustomError } from '../../../../lib/utils/error.ts';
import { generateChoiceMap } from '../_hooks/use-choice-map.tsx';
import dayjs from 'dayjs';
import { formatNumberTime } from '../../../../lib/utils/utils.ts';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../../../../components/shadcn/tooltip.tsx';
import useAtomicMutation from '../../../../hooks/use-atomic-mutation.ts';
import { useQueryClient } from '@tanstack/react-query';

const untouchedFieldIndex = {
  name: 0,
  studentNumber: 1,
  major: 2,
};

const defaultUntouchedField = {
  name: 'DEFAULT_NAME',
  studentNumber: 'DEFAULT_STUDENT_NUMBER',
  major: 'DEFAULT_MAJOR',
};

const FooterSection = ({
  deadline,
  application,
  selectedSectionIdx,
  isOnlySharedSection,
  recruitment,
}: {
  deadline: z.infer<typeof DeadlineSchema>;
  application: z.infer<typeof ReadApplicationResponseSchema>;
  selectedSectionIdx: number;
  isOnlySharedSection: boolean;
  recruitment: z.infer<typeof RecruitmentSchema>;
}) => {
  const { toast } = useToast();
  const { handleSubmit, getValues, reset } = useFormContext<IFormApplication>();
  const queryClient = useQueryClient();

  const { recruitmentCode } = useParams<{ recruitmentCode: string }>();
  const { saveApplication } = useApplicantApi(recruitmentCode!);

  const [diff, setDiff] = useState<number>(dayjs(deadline).diff(dayjs()));

  const saveMutate = useAtomicMutation({
    mutationFn: (requestBody: ISaveApplication) => saveApplication(requestBody),
    requestName: 'saveApplication',
  });

  useEffect(() => {
    if (diff <= 0) return;

    const interval = setInterval(() => {
      setDiff(dayjs(deadline).diff(dayjs()));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const onSubmit = async (data: IFormApplication) => {
    // 선택된 섹션에 해당하는 질문만 필터링
    const selectedSectionAnswers = filterSelectedAnswer(
      data.sections,
      selectedSectionIdx,
      isOnlySharedSection,
    );

    // IFormApplication to ISaveApplication
    const convertedAnswers = convertToSaveApplication(selectedSectionAnswers);

    const name = getValues(
      `sections.${SHARED_SECTION_INDEX}.answers.${untouchedFieldIndex.name}.content`,
    );
    const studentNumber = getValues(
      `sections.${SHARED_SECTION_INDEX}.answers.${untouchedFieldIndex.studentNumber}.content`,
    );
    const major = getValues(
      `sections.${SHARED_SECTION_INDEX}.answers.${untouchedFieldIndex.major}.content`,
    );

    const requestBody = {
      id: application ? application.id : null,
      studentNumber: studentNumber || defaultUntouchedField.studentNumber,
      name: name || defaultUntouchedField.name,
      major: major || defaultUntouchedField.major,
      sections: convertedAnswers,
      recruitmentCode: recruitment.code,
    };

    try {
      const response = await saveMutate.mutateAsync(requestBody);

      /*
      FixMe
        - 지금 response 를 바탕으로 다시 form reset 하는건 좋은데 문제가 최초 생성하는 지원서일 경우 지원서의 id도 다시 갱신되어야합니다
        - 이에 대한 처리가 따로 없는데 뭔가 위에 로직을 고치기 애매해서 우선 그냥 invalidate 시켜야할 것 같습니다.
       */
      if (requestBody.id === null) {
        await queryClient.invalidateQueries({
          queryKey: ['readApplication', recruitmentCode],
        });
      } else {
        const convertedApplication = convertToFormApplication(
          response,
          generateChoiceMap(recruitment),
        );

        reset(convertedApplication);
      }

      toast({
        title: '지원서 저장이 완료되었습니다.',
        state: 'success',
      });
      // FixMe
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      printCustomError(e, 'applicantLogin');

      toast({
        title: e?.response?.data?.message || '예기치 못한 문제가 발생했습니다.',
        state: 'error',
      });
    }
  };

  const onFormError = () => {
    toast({
      title: '입력을 다시 확인해주세요.',
      state: 'error',
    });
  };

  return (
    <>
      <CrewsFooter>
        <Tooltip>
          <TooltipTrigger>
            <Button
              disabled={diff <= 0}
              size="lg"
              onClick={handleSubmit(onSubmit, onFormError)}
            >
              {diff <= 0 ? '모집 기간이 아닙니다' : '제출하기'}
            </Button>
          </TooltipTrigger>

          <TooltipContent>
            {diff <= 0 ? (
              <p>⏰ 마감되었습니다!</p>
            ) : (
              <p>⏰ 마감까지 {formatNumberTime(diff)}</p>
            )}
          </TooltipContent>
        </Tooltip>
      </CrewsFooter>
    </>
  );
};

export default FooterSection;
