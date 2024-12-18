import CrewsDialog from '../../../../components/molecule/crews-dialog.tsx';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../../../hooks/use-toast.ts';
import useDialog from '../../../../hooks/use-dialog.ts';
import { printCustomError } from '../../../../lib/utils/error.ts';
import Loading from '../../../../components/atom/loading.tsx';
import useAdminApi from '../../../../apis/admin-api.ts';
import CrewsFooter from '../../../../components/molecule/crews-footer.tsx';
import { z } from 'zod';
import { ProgressSchema } from '../../../../lib/schemas/progress-schema.ts';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../../../../components/shadcn/tooltip.tsx';
import useAtomicMutation from '../../../../hooks/use-atomic-mutation.ts';
import { Button } from '../../../../components/shadcn/button.tsx';

const FooterSection = ({
  passApplicationIds,
  progress,
}: {
  passApplicationIds: number[];
  progress: z.infer<typeof ProgressSchema>;
}) => {
  const { saveEvaluation, sendEvaluationMail } = useAdminApi();

  const saveMutation = useAtomicMutation({
    mutationFn: () => {
      if (!passApplicationIds) throw new Error();
      return saveEvaluation({ passApplicationIds });
    },
    requestName: 'saveEvaluation',
  });

  const sendMutation = useAtomicMutation({
    mutationFn: sendEvaluationMail,
    requestName: 'sendEvaluationMail',
  });

  const { toast } = useToast();
  const dialogProps = useDialog();
  const handleSaveClick = async () => {
    try {
      await saveMutation.mutateAsync();
      toast({
        title: '임시저장이 완료되었습니다.',
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

  const queryClient = useQueryClient();
  const handleSendConfirmClick = async () => {
    try {
      await saveMutation.mutateAsync();
      await sendMutation.mutateAsync();
      await queryClient.invalidateQueries({
        queryKey: ['recruitmentProgress'],
      });
      toast({
        title: '메일 전송이 완료되었습니다.',
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

  return (
    <>
      {saveMutation.isPending ||
      sendMutation.isPending ||
      queryClient.isFetching({ queryKey: ['recruitmentProgress'] }) ? (
        <Loading />
      ) : null}
      <CrewsFooter>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Button size="lg" disabled>
                CSV 추출
              </Button>
            </div>
          </TooltipTrigger>

          <TooltipContent>
            <p>서비스 준비중 🙇🏻</p>
          </TooltipContent>
        </Tooltip>

        <Button
          size="lg"
          disabled={progress === 'ANNOUNCED'}
          onClick={handleSaveClick}
        >
          임시 저장
        </Button>
        <Button
          size="lg"
          disabled={progress === 'ANNOUNCED'}
          onClick={() => dialogProps.toggleOpen()}
        >
          평가 완료
        </Button>
      </CrewsFooter>
      <CrewsDialog
        {...dialogProps}
        action={handleSendConfirmClick}
        className="w-80 p-4 text-center"
      >
        <div className="flex flex-col gap-4 p-4">
          <p className="text-center text-lg font-light">
            <span className="text-xl font-bold text-crews-b05">
              📮 모집 결과 메일
            </span>{' '}
            을 발송합니다.
          </p>
          <p className="text-sm font-light text-crews-bk01">
            메일 전송 후에도 지원자들의 지원서를 확인할 수 있지만
            <span className="font-bold"> 메일 재전송은 불가합니다.</span>
          </p>
        </div>
      </CrewsDialog>
    </>
  );
};

export default FooterSection;
