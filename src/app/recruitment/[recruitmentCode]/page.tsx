import Container from '../../../components/shared/container.tsx';
import ApplyForm from './_components/apply-form.tsx';

import InfoSection from './_components/info-section.tsx';
import { readRecruitmentByCode } from '../../../apis/base-api.ts';
import { useQuery } from '@tanstack/react-query';
import { Navigate, useParams } from 'react-router-dom';
import Loading from '../../../components/shared/loading.tsx';
import { printCustomError } from '../../../lib/utils/error.ts';

const Page = () => {
  const { recruitmentCode } = useParams<{ recruitmentCode: string }>();
  const readQuery = useQuery({
    queryKey: ['recruitmentByCode'],
    queryFn: () => readRecruitmentByCode(recruitmentCode!),
  });

  if (readQuery.isFetching) return <Loading />;
  else if (readQuery.isError) {
    printCustomError(readQuery.error, 'readQuery');
    return <Navigate to="/error" replace />;
  }
  console.log(readQuery.data);
  return (
    <Container className="0 flex gap-10">
      <section className="flex flex-grow items-center justify-center">
        <div className="mb-10 w-full max-w-[375px]">
          <ApplyForm />
        </div>
      </section>
      <section className="my-0 w-full flex-1 overflow-scroll md:my-[6rem]">
        <InfoSection />
      </section>
    </Container>
  );
};

export default Page;