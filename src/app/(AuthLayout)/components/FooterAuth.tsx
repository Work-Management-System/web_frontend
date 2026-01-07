'use client';
import { Box, Typography, useMediaQuery } from '@mui/material';
import React from 'react';
import Image from 'next/image';
import manazeIT from '@/assets/Images/manazeit_logo.png';
import Link from 'next/link';

import 'react-phone-input-2/lib/style.css';

import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import LanguageIcon from '@mui/icons-material/Language';
import facebook from '@/assets/Images/facebook.png';
import twitterX from '@/assets/Images/twitter.png';
import instagram from '@/assets/Images/social.png';
import linkedin from '@/assets/Images/linkedin.png';


function FooterAuth() {
    const isMobile = useMediaQuery('(max-width: 600px)');
    const isTablet = useMediaQuery('(min-width: 601px) and (max-width: 960px)');
    const isDesktop = useMediaQuery('(min-width: 961px)');

    return (
        <Box sx={{ 
            display: 'flex', 
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: isMobile ? 'center' : 'space-between', 
            alignItems: isMobile ? 'center' : 'center', 
            paddingLeft: isMobile ? '10px' : '15px', 
            paddingRight: isMobile ? '10px' : '20px', 
            flexWrap: 'wrap', 
            paddingTop: isMobile ? '15px' : '10px', 
            paddingBottom: isMobile ? '15px' : '10px',
            gap: isMobile ? 2 : 1,
        }}>
            <Box className='footer-insider' sx={{ 
                display: 'flex', 
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: 'center', 
                gap: isMobile ? '8px' : '10px', 
                flexWrap: 'wrap',
                justifyContent: isMobile ? 'center' : 'flex-start',
                width: isMobile ? '100%' : 'auto',
            }}>
                <Typography variant="subtitle2" sx={{
                    color: '#000',
                    fontSize: isMobile ? '12px' : '14px',
                    padding: isMobile ? '5px' : '10px',
                    display: 'flex',
                    gap: '3px',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    justifyContent: isMobile ? 'center' : 'flex-start',
                }}>
                    <PhoneIcon sx={{ color: '#027cc1', fontSize: isMobile ? '16px' : '20px' }} /> 
                    <Link href="tel:9216953958" style={{ color: '#000', fontSize: 'inherit' }}> +91-9216953958</Link>
                    {!isMobile && " , "}
                    {isMobile && <br />}
                    <Link href="tel:0172-5053958" style={{ color: '#000', fontSize: 'inherit' }}>0172-5053958</Link>
                </Typography>
                <Typography variant="subtitle2" sx={{ 
                    color: '#000', 
                    fontSize: isMobile ? '12px' : '14px', 
                    padding: isMobile ? '5px' : '10px', 
                    display: 'flex', 
                    gap: '3px', 
                    alignItems: 'center',
                    justifyContent: isMobile ? 'center' : 'flex-start',
                }}>
                    <EmailIcon sx={{ color: '#027cc1', fontSize: isMobile ? '16px' : '20px' }} /> 
                    <Link href="mailto:info@manazeit.com" style={{ color: '#000', fontSize: 'inherit' }}> info@manazeit.com</Link>
                </Typography>
                <Typography variant="subtitle2" sx={{ 
                    color: '#000', 
                    fontSize: isMobile ? '12px' : '14px', 
                    padding: isMobile ? '5px' : '10px', 
                    display: 'flex', 
                    gap: '3px', 
                    alignItems: 'center',
                    justifyContent: isMobile ? 'center' : 'flex-start',
                }}>
                    <LanguageIcon sx={{ color: '#027cc1', fontSize: isMobile ? '16px' : '20px' }} />
                    <Link href="www.manazeit.com" target='_blank' style={{ color: '#000', fontSize: 'inherit' }}> www.manazeit.com</Link>
                </Typography>
            </Box>
            <Box className='social-icons-foot' sx={{ 
                display: 'flex', 
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: 'center', 
                gap: isMobile ? '8px' : '10px', 
                flexWrap: 'wrap',
                justifyContent: isMobile ? 'center' : 'center',
                width: isMobile ? '100%' : 'auto',
            }}>
                <Typography variant="body1" sx={{ 
                    fontSize: isMobile ? '12px' : '14px',
                    display: isMobile ? 'none' : 'block',
                }}>
                    Follow Us On: 
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '5px' }}>
                    {isMobile && <Typography sx={{ fontSize: '12px', marginRight: '5px' }}>Follow Us:</Typography>}
                    <Link href="https://www.facebook.com/manazeit/" target='_blank'>
                        <Image
                            src={facebook}
                            alt="facebook"
                            width={isMobile ? 18 : 21}
                            height={isMobile ? 18 : 21}
                            style={{
                                objectFit: 'contain',
                            }}
                        />
                    </Link>
                    <Link href="https://x.com/manazeit" target='_blank'>
                        <Image
                            src={twitterX}
                            alt="twitter"
                            width={isMobile ? 18 : 21}
                            height={isMobile ? 18 : 21}
                            style={{
                                objectFit: 'contain',
                            }}
                        />
                    </Link>
                    <Link href="https://www.instagram.com/manazeit.com/" target='_blank'>
                        <Image
                            src={instagram}
                            alt="instagram"
                            width={isMobile ? 18 : 21}
                            height={isMobile ? 18 : 21}
                            style={{
                                objectFit: 'contain',
                            }}
                        />
                    </Link>
                    <Link href="https://linkedin.com/company/manazeit/" target='_blank'>
                        <Image
                            src={linkedin}
                            alt="linkedin"
                            width={isMobile ? 18 : 21}
                            height={isMobile ? 18 : 21}
                            style={{
                                objectFit: 'contain',
                            }}
                        />
                    </Link>
                </Box>
            </Box>

            <Box sx={{ 
                display: 'flex', 
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: 'center', 
                gap: isMobile ? '5px' : '10px', 
                flexWrap: 'wrap',
                justifyContent: isMobile ? 'center' : 'flex-end',
                width: isMobile ? '100%' : 'auto',
            }}>
                <Typography variant="body1" sx={{ 
                    fontSize: isMobile ? '12px' : '14px',
                }}>
                    Powered by: 
                </Typography>
                <Box>
                    <Link href="www.manazeit.com" target='_blank'>
                        <Image
                            src={manazeIT}
                            alt="logo"
                            width={isMobile ? 80 : isTablet ? 90 : 99}
                            height={isMobile ? 17 : isTablet ? 19 : 21}
                            style={{
                                objectFit: 'contain',
                            }}
                        />
                    </Link>
                </Box>
            </Box>
        </Box>
    )
}

export default FooterAuth
