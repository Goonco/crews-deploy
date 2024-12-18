import { ChoiceMap } from '../_hooks/use-choice-map.tsx';
import { IFormApplication, SHARED_SECTION_INDEX } from '../page';
import { z } from 'zod';
import { SectionSchema } from '../../../../lib/schemas/section-schema.ts';
import {
  ApplicationDetailSchema,
  ISaveApplication,
} from '../../../../lib/schemas/application-schema.ts';

export const convertToFormApplication = (
  application: z.infer<typeof ApplicationDetailSchema>,
  choiceMap: ChoiceMap,
): IFormApplication => {
  return {
    sections: application.sections.map((section) => ({
      sectionId: section.sectionId,
      answers: section.answers.map((answer) => {
        if (answer.type === 'SELECTIVE') {
          // choiceMap 에 존재하는 choiceId 중, 선택된 choiceId는 choiceId로, 아닌 경우는 false 로 변환
          const convertedChoiceIds = choiceMap[answer.questionId].map(
            (choiceId) =>
              answer.choiceIds?.includes(choiceId) ? choiceId : false,
          );

          return {
            questionId: answer.questionId,
            content: null,
            choiceIds: convertedChoiceIds as (number | boolean)[],
            type: answer.type,
          };
        } else {
          return {
            questionId: answer.questionId,
            content: answer.content,
            choiceIds: null,
            type: answer.type,
          };
        }
      }),
    })),
  };
};

// const filteredChoiceIds =
//   (
//     answer.choiceIds?.filter(
//       (choiceId) => choiceId !== false,
//     ) as number[]
//   ).map((choiceId) => Number(choiceId)) || [];

export const convertToSaveApplication = (
  sections: IFormApplication['sections'],
): ISaveApplication['sections'] => {
  return sections.map((section) => ({
    sectionId: section.sectionId,
    answers: section.answers.map((answer) => {
      if (answer.type === 'SELECTIVE') {
        const filteredChoiceIds =
          answer.choiceIds?.filter(Boolean).map(Number) || [];

        return {
          questionId: answer.questionId,
          content: null,
          choiceIds: filteredChoiceIds.length === 0 ? null : filteredChoiceIds,
          questionType: answer.type,
        };
      } else {
        return {
          ...answer,
          questionType: answer.type,
          choiceIds: null,
        };
      }
    }),
  }));
};

/**
 * Filter answers related to selected or shared section
 * If isOnlySharedSection is true, filter only shared section
 * @param sections - answers for each section
 * @param selectedSectionIndex - selected section index
 * @param isOnlySharedSection - whether to filter only shared section
 * @returns filtered answers
 */
export const filterSelectedAnswer = (
  sections: IFormApplication['sections'],
  selectedSectionIndex: number,
  isOnlySharedSection: boolean,
): IFormApplication['sections'] => {
  return sections.map((section, index) => {
    const isSharedSection = index === SHARED_SECTION_INDEX;
    const isSelectedSection =
      !isOnlySharedSection && index === selectedSectionIndex;

    if (isSharedSection || isSelectedSection) {
      return section;
    } else {
      return {
        ...section,
        answers: section.answers.map((answer) => {
          if (answer.type === 'NARRATIVE')
            return {
              ...answer,
              content: null,
            };
          else if (answer.type === 'SELECTIVE')
            return {
              ...answer,
              choiceIds: [],
            };
          return answer; // 기본적으로 answer 그대로 반환
        }),
      };
    }
  });
};

export const getInitialSectionSelection = (
  applicationSections:
    | Pick<z.infer<typeof ApplicationDetailSchema>, 'sections'>['sections']
    | undefined,
  recruitmentSections: z.infer<typeof SectionSchema>[] | undefined,
) => {
  if (!applicationSections || !recruitmentSections) return 1;

  // answers 에 답변이 있는 첫 번째 section 찾기
  const initialSectionIndex = applicationSections
    .slice(1)
    .findIndex((section) =>
      section.answers.some(
        (answer) => answer.content || answer.choiceIds?.length,
      ),
    );

  // 답변이 있는 섹션이 있으면 해당 sectionId를 반환, 없으면 1 반환
  return initialSectionIndex !== -1 ? initialSectionIndex + 1 : 1;
};
