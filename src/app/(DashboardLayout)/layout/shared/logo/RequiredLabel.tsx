const RequiredLabel = ({ label }: { label: string }) => (
  <span>
    {label} <span style={{ color: 'red' }}>*</span>
  </span>
);
export default RequiredLabel;