import useBreakpoints from '../../hooks/use-breakpoints';
import { CrewsBreakpoints } from '../../styles/breakpoints';

interface CrewsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  showBreakpoints: keyof typeof CrewsBreakpoints;
  children?: React.ReactNode;
}

const CrewsSidebar = ({
  isOpen,
  onClose,
  showBreakpoints,
  children,
}: CrewsSidebarProps) => {
  const { isSmaller } = useBreakpoints({ breakpoint: showBreakpoints });

  // screen 다시 넓게 했을 시, sidebar close
  if (!isSmaller) {
    if (isOpen) {
      onClose();
    }

    return null;
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 top-[60px] h-[calc(100vh-60px)] bg-black bg-opacity-50 transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      <div
        className={`shadow-lg fixed right-0 top-[60px] h-[calc(100vh-60px)] w-72 transform bg-white transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {children}
      </div>
    </>
  );
};

export default CrewsSidebar;
