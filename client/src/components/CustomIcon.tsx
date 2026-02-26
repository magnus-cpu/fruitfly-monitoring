
import L from 'leaflet';
import ReactDOMServer from 'react-dom/server';
import { Bug, Router } from 'lucide-react';

const createIcon = (
  icon: React.ReactElement,
  className: string,
  style?: React.CSSProperties
) => {
  return L.divIcon({
    html: ReactDOMServer.renderToString(
      <div className={`p-2 rounded-full shadow-lg ${className}`} style={style}>
        {icon}
      </div>
    ),
    className: '', // important to clear default leaflet styles
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

export const sensorIcon = createIcon(<Bug size={16} />, 'bg-white text-blue-500');
export const gatewayIcon = createIcon(<Router size={16} />, 'bg-white text-red-500');

export const getSensorIcon = (status: string) => {
  let className = 'bg-white text-gray-500'; // Default to gray for unknown status
  let style: React.CSSProperties | undefined;
  if (status === 'active') {
    className = 'text-white bg-cover bg-center';
    style = { backgroundImage: "url('/mangoImage.jpg')" };
  } else if (status === 'inactive') {
    className = 'bg-red-500 text-white';
  }
  return createIcon(<Bug size={16} />, className, style);
};
