import { Helmet, HelmetProvider } from 'react-helmet-async';


type Props = {
  description?: string;
  children: any;
  title?: string;
};

const PageContainer = ({ title, description, children }: Props) => (
  <>
    <HelmetProvider>
      <div>
        <Helmet>
          <title>{title}</title>
          <meta name="description" content={description} />
        </Helmet>
        {children}
      </div>
    </HelmetProvider>
  </>
);

export default PageContainer;
