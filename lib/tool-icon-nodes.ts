/**
 * Raw icon path data for the tools listed in lib/tool-icons.tsx`s TOOL_ICONS map,
 * generated from lucide-react's per-icon __iconNode exports.
 *
 * next/og (satori) cannot render lucide-react's <Icon> components directly: since
 * lucide-react 1.x they read defaults via a useContext() call, and satori invokes
 * component functions without a React hook dispatcher, so any hook throws. Keeping
 * the raw [tag, attrs] tuples here sidesteps lucide-react's component entirely —
 * see lib/og-icon.tsx for the tiny renderer that turns these back into <svg>.
 */
export type IconNode = [tag: string, attrs: Record<string, string | number>][];

export const TOOL_ICON_NODES: Record<string, IconNode> = {
  "ImageIcon": [
    [
      "rect",
      {
        "width": "18",
        "height": "18",
        "x": "3",
        "y": "3",
        "rx": "2",
        "ry": "2",
        "key": "1m3agn"
      }
    ],
    [
      "circle",
      {
        "cx": "9",
        "cy": "9",
        "r": "2",
        "key": "af1f0g"
      }
    ],
    [
      "path",
      {
        "d": "m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21",
        "key": "1xmnt7"
      }
    ]
  ],
  "Image": [
    [
      "rect",
      {
        "width": "18",
        "height": "18",
        "x": "3",
        "y": "3",
        "rx": "2",
        "ry": "2",
        "key": "1m3agn"
      }
    ],
    [
      "circle",
      {
        "cx": "9",
        "cy": "9",
        "r": "2",
        "key": "af1f0g"
      }
    ],
    [
      "path",
      {
        "d": "m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21",
        "key": "1xmnt7"
      }
    ]
  ],
  "Crop": [
    [
      "path",
      {
        "d": "M6 2v14a2 2 0 0 0 2 2h14",
        "key": "ron5a4"
      }
    ],
    [
      "path",
      {
        "d": "M18 22V8a2 2 0 0 0-2-2H2",
        "key": "7s9ehn"
      }
    ]
  ],
  "PackageOpen": [
    [
      "path",
      {
        "d": "M12 22v-9",
        "key": "x3hkom"
      }
    ],
    [
      "path",
      {
        "d": "M15.17 2.21a1.67 1.67 0 0 1 1.63 0L21 4.57a1.93 1.93 0 0 1 0 3.36L8.82 14.79a1.655 1.655 0 0 1-1.64 0L3 12.43a1.93 1.93 0 0 1 0-3.36z",
        "key": "2ntwy6"
      }
    ],
    [
      "path",
      {
        "d": "M20 13v3.87a2.06 2.06 0 0 1-1.11 1.83l-6 3.08a1.93 1.93 0 0 1-1.78 0l-6-3.08A2.06 2.06 0 0 1 4 16.87V13",
        "key": "1pmm1c"
      }
    ],
    [
      "path",
      {
        "d": "M21 12.43a1.93 1.93 0 0 0 0-3.36L8.83 2.2a1.64 1.64 0 0 0-1.63 0L3 4.57a1.93 1.93 0 0 0 0 3.36l12.18 6.86a1.636 1.636 0 0 0 1.63 0z",
        "key": "12ttoo"
      }
    ]
  ],
  "Ruler": [
    [
      "path",
      {
        "d": "M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z",
        "key": "icamh8"
      }
    ],
    [
      "path",
      {
        "d": "m14.5 12.5 2-2",
        "key": "inckbg"
      }
    ],
    [
      "path",
      {
        "d": "m11.5 9.5 2-2",
        "key": "fmmyf7"
      }
    ],
    [
      "path",
      {
        "d": "m8.5 6.5 2-2",
        "key": "vc6u1g"
      }
    ],
    [
      "path",
      {
        "d": "m17.5 15.5 2-2",
        "key": "wo5hmg"
      }
    ]
  ],
  "Smartphone": [
    [
      "rect",
      {
        "width": "14",
        "height": "20",
        "x": "5",
        "y": "2",
        "rx": "2",
        "ry": "2",
        "key": "1yt0o3"
      }
    ],
    [
      "path",
      {
        "d": "M12 18h.01",
        "key": "mhygvu"
      }
    ]
  ],
  "Pipette": [
    [
      "path",
      {
        "d": "m12 9-8.414 8.414A2 2 0 0 0 3 18.828v1.344a2 2 0 0 1-.586 1.414A2 2 0 0 1 3.828 21h1.344a2 2 0 0 0 1.414-.586L15 12",
        "key": "1y3wsu"
      }
    ],
    [
      "path",
      {
        "d": "m18 9 .4.4a1 1 0 1 1-3 3l-3.8-3.8a1 1 0 1 1 3-3l.4.4 3.4-3.4a1 1 0 1 1 3 3z",
        "key": "110lr1"
      }
    ],
    [
      "path",
      {
        "d": "m2 22 .414-.414",
        "key": "jhxm08"
      }
    ]
  ],
  "PaintbrushVertical": [
    [
      "path",
      {
        "d": "M10 2v2",
        "key": "7u0qdc"
      }
    ],
    [
      "path",
      {
        "d": "M14 2v4",
        "key": "qmzblu"
      }
    ],
    [
      "path",
      {
        "d": "M17 2a1 1 0 0 1 1 1v9H6V3a1 1 0 0 1 1-1z",
        "key": "ycvu00"
      }
    ],
    [
      "path",
      {
        "d": "M6 12a1 1 0 0 0-1 1v1a2 2 0 0 0 2 2h2a1 1 0 0 1 1 1v2.9a2 2 0 1 0 4 0V17a1 1 0 0 1 1-1h2a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1",
        "key": "iw4wnp"
      }
    ]
  ],
  "Zap": [
    [
      "path",
      {
        "d": "M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z",
        "key": "1xq2db"
      }
    ]
  ],
  "Scaling": [
    [
      "path",
      {
        "d": "M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7",
        "key": "1m0v6g"
      }
    ],
    [
      "path",
      {
        "d": "M14 15H9v-5",
        "key": "pi4jk9"
      }
    ],
    [
      "path",
      {
        "d": "M16 3h5v5",
        "key": "1806ms"
      }
    ],
    [
      "path",
      {
        "d": "M21 3 9 15",
        "key": "15kdhq"
      }
    ]
  ],
  "Brush": [
    [
      "path",
      {
        "d": "m11 10 3 3",
        "key": "fzmg1i"
      }
    ],
    [
      "path",
      {
        "d": "M6.5 21A3.5 3.5 0 1 0 3 17.5a2.62 2.62 0 0 1-.708 1.792A1 1 0 0 0 3 21z",
        "key": "p4q2r7"
      }
    ],
    [
      "path",
      {
        "d": "M9.969 17.031 21.378 5.624a1 1 0 0 0-3.002-3.002L6.967 14.031",
        "key": "wy6l02"
      }
    ]
  ],
  "ScanSearch": [
    [
      "path",
      {
        "d": "M3 7V5a2 2 0 0 1 2-2h2",
        "key": "aa7l1z"
      }
    ],
    [
      "path",
      {
        "d": "M17 3h2a2 2 0 0 1 2 2v2",
        "key": "4qcy5o"
      }
    ],
    [
      "path",
      {
        "d": "M21 17v2a2 2 0 0 1-2 2h-2",
        "key": "6vwrx8"
      }
    ],
    [
      "path",
      {
        "d": "M7 21H5a2 2 0 0 1-2-2v-2",
        "key": "ioqczr"
      }
    ],
    [
      "circle",
      {
        "cx": "12",
        "cy": "12",
        "r": "3",
        "key": "1v7zrd"
      }
    ],
    [
      "path",
      {
        "d": "m16 16-1.9-1.9",
        "key": "1dq9hf"
      }
    ]
  ],
  "BookmarkCheck": [
    [
      "path",
      {
        "d": "M17 3a2 2 0 0 1 2 2v15a1 1 0 0 1-1.496.868l-4.512-2.578a2 2 0 0 0-1.984 0l-4.512 2.578A1 1 0 0 1 5 20V5a2 2 0 0 1 2-2z",
        "key": "oz39mx"
      }
    ],
    [
      "path",
      {
        "d": "m9 10 2 2 4-4",
        "key": "1gnqz4"
      }
    ]
  ],
  "Frame": [
    [
      "line",
      {
        "x1": "22",
        "x2": "2",
        "y1": "6",
        "y2": "6",
        "key": "15w7dq"
      }
    ],
    [
      "line",
      {
        "x1": "22",
        "x2": "2",
        "y1": "18",
        "y2": "18",
        "key": "1ip48p"
      }
    ],
    [
      "line",
      {
        "x1": "6",
        "x2": "6",
        "y1": "2",
        "y2": "22",
        "key": "a2lnyx"
      }
    ],
    [
      "line",
      {
        "x1": "18",
        "x2": "18",
        "y1": "2",
        "y2": "22",
        "key": "8vb6jd"
      }
    ]
  ],
  "PenTool": [
    [
      "path",
      {
        "d": "M15.707 21.293a1 1 0 0 1-1.414 0l-1.586-1.586a1 1 0 0 1 0-1.414l5.586-5.586a1 1 0 0 1 1.414 0l1.586 1.586a1 1 0 0 1 0 1.414z",
        "key": "nt11vn"
      }
    ],
    [
      "path",
      {
        "d": "m18 13-1.375-6.874a1 1 0 0 0-.746-.776L3.235 2.028a1 1 0 0 0-1.207 1.207L5.35 15.879a1 1 0 0 0 .776.746L13 18",
        "key": "15qc1e"
      }
    ],
    [
      "path",
      {
        "d": "m2.3 2.3 7.286 7.286",
        "key": "1wuzzi"
      }
    ],
    [
      "circle",
      {
        "cx": "11",
        "cy": "11",
        "r": "2",
        "key": "xmgehs"
      }
    ]
  ],
  "Grid3X3": [
    [
      "rect",
      {
        "width": "18",
        "height": "18",
        "x": "3",
        "y": "3",
        "rx": "2",
        "key": "afitv7"
      }
    ],
    [
      "path",
      {
        "d": "M3 9h18",
        "key": "1pudct"
      }
    ],
    [
      "path",
      {
        "d": "M3 15h18",
        "key": "5xshup"
      }
    ],
    [
      "path",
      {
        "d": "M9 3v18",
        "key": "fh3hqa"
      }
    ],
    [
      "path",
      {
        "d": "M15 3v18",
        "key": "14nvp0"
      }
    ]
  ],
  "QrCode": [
    [
      "rect",
      {
        "width": "5",
        "height": "5",
        "x": "3",
        "y": "3",
        "rx": "1",
        "key": "1tu5fj"
      }
    ],
    [
      "rect",
      {
        "width": "5",
        "height": "5",
        "x": "16",
        "y": "3",
        "rx": "1",
        "key": "1v8r4q"
      }
    ],
    [
      "rect",
      {
        "width": "5",
        "height": "5",
        "x": "3",
        "y": "16",
        "rx": "1",
        "key": "1x03jg"
      }
    ],
    [
      "path",
      {
        "d": "M21 16h-3a2 2 0 0 0-2 2v3",
        "key": "177gqh"
      }
    ],
    [
      "path",
      {
        "d": "M21 21v.01",
        "key": "ents32"
      }
    ],
    [
      "path",
      {
        "d": "M12 7v3a2 2 0 0 1-2 2H7",
        "key": "8crl2c"
      }
    ],
    [
      "path",
      {
        "d": "M3 12h.01",
        "key": "nlz23k"
      }
    ],
    [
      "path",
      {
        "d": "M12 3h.01",
        "key": "n36tog"
      }
    ],
    [
      "path",
      {
        "d": "M12 16v.01",
        "key": "133mhm"
      }
    ],
    [
      "path",
      {
        "d": "M16 12h1",
        "key": "1slzba"
      }
    ],
    [
      "path",
      {
        "d": "M21 12v.01",
        "key": "1lwtk9"
      }
    ],
    [
      "path",
      {
        "d": "M12 21v-1",
        "key": "1880an"
      }
    ]
  ],
  "ScanQrCode": [
    [
      "path",
      {
        "d": "M17 12v4a1 1 0 0 1-1 1h-4",
        "key": "uk4fdo"
      }
    ],
    [
      "path",
      {
        "d": "M17 3h2a2 2 0 0 1 2 2v2",
        "key": "4qcy5o"
      }
    ],
    [
      "path",
      {
        "d": "M17 8V7",
        "key": "q2g9wo"
      }
    ],
    [
      "path",
      {
        "d": "M21 17v2a2 2 0 0 1-2 2h-2",
        "key": "6vwrx8"
      }
    ],
    [
      "path",
      {
        "d": "M3 7V5a2 2 0 0 1 2-2h2",
        "key": "aa7l1z"
      }
    ],
    [
      "path",
      {
        "d": "M7 17h.01",
        "key": "19xn7k"
      }
    ],
    [
      "path",
      {
        "d": "M7 21H5a2 2 0 0 1-2-2v-2",
        "key": "ioqczr"
      }
    ],
    [
      "rect",
      {
        "x": "7",
        "y": "7",
        "width": "5",
        "height": "5",
        "rx": "1",
        "key": "m9kyts"
      }
    ]
  ],
  "Cpu": [
    [
      "path",
      {
        "d": "M12 20v2",
        "key": "1lh1kg"
      }
    ],
    [
      "path",
      {
        "d": "M12 2v2",
        "key": "tus03m"
      }
    ],
    [
      "path",
      {
        "d": "M17 20v2",
        "key": "1rnc9c"
      }
    ],
    [
      "path",
      {
        "d": "M17 2v2",
        "key": "11trls"
      }
    ],
    [
      "path",
      {
        "d": "M2 12h2",
        "key": "1t8f8n"
      }
    ],
    [
      "path",
      {
        "d": "M2 17h2",
        "key": "7oei6x"
      }
    ],
    [
      "path",
      {
        "d": "M2 7h2",
        "key": "asdhe0"
      }
    ],
    [
      "path",
      {
        "d": "M20 12h2",
        "key": "1q8mjw"
      }
    ],
    [
      "path",
      {
        "d": "M20 17h2",
        "key": "1fpfkl"
      }
    ],
    [
      "path",
      {
        "d": "M20 7h2",
        "key": "1o8tra"
      }
    ],
    [
      "path",
      {
        "d": "M7 20v2",
        "key": "4gnj0m"
      }
    ],
    [
      "path",
      {
        "d": "M7 2v2",
        "key": "1i4yhu"
      }
    ],
    [
      "rect",
      {
        "x": "4",
        "y": "4",
        "width": "16",
        "height": "16",
        "rx": "2",
        "key": "1vbyd7"
      }
    ],
    [
      "rect",
      {
        "x": "8",
        "y": "8",
        "width": "8",
        "height": "8",
        "rx": "1",
        "key": "z9xiuo"
      }
    ]
  ],
  "Eraser": [
    [
      "path",
      {
        "d": "M21 21H8a2 2 0 0 1-1.42-.587l-3.994-3.999a2 2 0 0 1 0-2.828l10-10a2 2 0 0 1 2.829 0l5.999 6a2 2 0 0 1 0 2.828L12.834 21",
        "key": "g5wo59"
      }
    ],
    [
      "path",
      {
        "d": "m5.082 11.09 8.828 8.828",
        "key": "1wx5vj"
      }
    ]
  ],
  "Camera": [
    [
      "path",
      {
        "d": "M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z",
        "key": "18u6gg"
      }
    ],
    [
      "circle",
      {
        "cx": "12",
        "cy": "13",
        "r": "3",
        "key": "1vg3eu"
      }
    ]
  ],
  "Type": [
    [
      "path",
      {
        "d": "M12 4v16",
        "key": "1654pz"
      }
    ],
    [
      "path",
      {
        "d": "M4 7V5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2",
        "key": "e0r10z"
      }
    ],
    [
      "path",
      {
        "d": "M9 20h6",
        "key": "s66wpe"
      }
    ]
  ],
  "Calculator": [
    [
      "rect",
      {
        "width": "16",
        "height": "20",
        "x": "4",
        "y": "2",
        "rx": "2",
        "key": "1nb95v"
      }
    ],
    [
      "line",
      {
        "x1": "8",
        "x2": "16",
        "y1": "6",
        "y2": "6",
        "key": "x4nwl0"
      }
    ],
    [
      "line",
      {
        "x1": "16",
        "x2": "16",
        "y1": "14",
        "y2": "18",
        "key": "wjye3r"
      }
    ],
    [
      "path",
      {
        "d": "M16 10h.01",
        "key": "1m94wz"
      }
    ],
    [
      "path",
      {
        "d": "M12 10h.01",
        "key": "1nrarc"
      }
    ],
    [
      "path",
      {
        "d": "M8 10h.01",
        "key": "19clt8"
      }
    ],
    [
      "path",
      {
        "d": "M12 14h.01",
        "key": "1etili"
      }
    ],
    [
      "path",
      {
        "d": "M8 14h.01",
        "key": "6423bh"
      }
    ],
    [
      "path",
      {
        "d": "M12 18h.01",
        "key": "mhygvu"
      }
    ],
    [
      "path",
      {
        "d": "M8 18h.01",
        "key": "lrp35t"
      }
    ]
  ],
  "Code2": [
    [
      "path",
      {
        "d": "m18 16 4-4-4-4",
        "key": "1inbqp"
      }
    ],
    [
      "path",
      {
        "d": "m6 8-4 4 4 4",
        "key": "15zrgr"
      }
    ],
    [
      "path",
      {
        "d": "m14.5 4-5 16",
        "key": "e7oirm"
      }
    ]
  ],
  "Palette": [
    [
      "path",
      {
        "d": "M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z",
        "key": "e79jfc"
      }
    ],
    [
      "circle",
      {
        "cx": "13.5",
        "cy": "6.5",
        "r": ".5",
        "fill": "currentColor",
        "key": "1okk4w"
      }
    ],
    [
      "circle",
      {
        "cx": "17.5",
        "cy": "10.5",
        "r": ".5",
        "fill": "currentColor",
        "key": "f64h9f"
      }
    ],
    [
      "circle",
      {
        "cx": "6.5",
        "cy": "12.5",
        "r": ".5",
        "fill": "currentColor",
        "key": "qy21gx"
      }
    ],
    [
      "circle",
      {
        "cx": "8.5",
        "cy": "7.5",
        "r": ".5",
        "fill": "currentColor",
        "key": "fotxhn"
      }
    ]
  ],
  "Binary": [
    [
      "rect",
      {
        "x": "14",
        "y": "14",
        "width": "4",
        "height": "6",
        "rx": "2",
        "key": "p02svl"
      }
    ],
    [
      "rect",
      {
        "x": "6",
        "y": "4",
        "width": "4",
        "height": "6",
        "rx": "2",
        "key": "xm4xkj"
      }
    ],
    [
      "path",
      {
        "d": "M6 20h4",
        "key": "1i6q5t"
      }
    ],
    [
      "path",
      {
        "d": "M14 10h4",
        "key": "ru81e7"
      }
    ],
    [
      "path",
      {
        "d": "M6 14h2v6",
        "key": "16z9wg"
      }
    ],
    [
      "path",
      {
        "d": "M14 4h2v6",
        "key": "1idq9u"
      }
    ]
  ],
  "KeyRound": [
    [
      "path",
      {
        "d": "M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z",
        "key": "1s6t7t"
      }
    ],
    [
      "circle",
      {
        "cx": "16.5",
        "cy": "7.5",
        "r": ".5",
        "fill": "currentColor",
        "key": "w0ekpg"
      }
    ]
  ],
  "Hash": [
    [
      "line",
      {
        "x1": "4",
        "x2": "20",
        "y1": "9",
        "y2": "9",
        "key": "4lhtct"
      }
    ],
    [
      "line",
      {
        "x1": "4",
        "x2": "20",
        "y1": "15",
        "y2": "15",
        "key": "vyu0kd"
      }
    ],
    [
      "line",
      {
        "x1": "10",
        "x2": "8",
        "y1": "3",
        "y2": "21",
        "key": "1ggp8o"
      }
    ],
    [
      "line",
      {
        "x1": "16",
        "x2": "14",
        "y1": "3",
        "y2": "21",
        "key": "weycgp"
      }
    ]
  ],
  "ArrowRightLeft": [
    [
      "path",
      {
        "d": "m16 3 4 4-4 4",
        "key": "1x1c3m"
      }
    ],
    [
      "path",
      {
        "d": "M20 7H4",
        "key": "zbl0bi"
      }
    ],
    [
      "path",
      {
        "d": "m8 21-4-4 4-4",
        "key": "h9nckh"
      }
    ],
    [
      "path",
      {
        "d": "M4 17h16",
        "key": "g4d7ey"
      }
    ]
  ],
  "AlignLeft": [
    [
      "path",
      {
        "d": "M21 5H3",
        "key": "1fi0y6"
      }
    ],
    [
      "path",
      {
        "d": "M15 12H3",
        "key": "6jk70r"
      }
    ],
    [
      "path",
      {
        "d": "M17 19H3",
        "key": "z6ezky"
      }
    ]
  ],
  "SwatchBook": [
    [
      "path",
      {
        "d": "M11 17a4 4 0 0 1-8 0V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2Z",
        "key": "1ldrpk"
      }
    ],
    [
      "path",
      {
        "d": "M16.7 13H19a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H7",
        "key": "11i5po"
      }
    ],
    [
      "path",
      {
        "d": "M 7 17h.01",
        "key": "1euzgo"
      }
    ],
    [
      "path",
      {
        "d": "m11 8 2.3-2.3a2.4 2.4 0 0 1 3.404.004L18.6 7.6a2.4 2.4 0 0 1 .026 3.434L9.9 19.8",
        "key": "o2gii7"
      }
    ]
  ],
  "Cake": [
    [
      "path",
      {
        "d": "M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8",
        "key": "1w3rig"
      }
    ],
    [
      "path",
      {
        "d": "M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1",
        "key": "n2jgmb"
      }
    ],
    [
      "path",
      {
        "d": "M2 21h20",
        "key": "1nyx9w"
      }
    ],
    [
      "path",
      {
        "d": "M7 8v3",
        "key": "1qtyvj"
      }
    ],
    [
      "path",
      {
        "d": "M12 8v3",
        "key": "hwp4zt"
      }
    ],
    [
      "path",
      {
        "d": "M17 8v3",
        "key": "1i6e5u"
      }
    ],
    [
      "path",
      {
        "d": "M7 4h.01",
        "key": "1bh4kh"
      }
    ],
    [
      "path",
      {
        "d": "M12 4h.01",
        "key": "1ujb9j"
      }
    ],
    [
      "path",
      {
        "d": "M17 4h.01",
        "key": "1upcoc"
      }
    ]
  ],
  "Clock": [
    [
      "circle",
      {
        "cx": "12",
        "cy": "12",
        "r": "10",
        "key": "1mglay"
      }
    ],
    [
      "path",
      {
        "d": "M12 6v6l4 2",
        "key": "mmk7yg"
      }
    ]
  ],
  "Link2": [
    [
      "path",
      {
        "d": "M9 17H7A5 5 0 0 1 7 7h2",
        "key": "8i5ue5"
      }
    ],
    [
      "path",
      {
        "d": "M15 7h2a5 5 0 1 1 0 10h-2",
        "key": "1b9ql8"
      }
    ],
    [
      "line",
      {
        "x1": "8",
        "x2": "16",
        "y1": "12",
        "y2": "12",
        "key": "1jonct"
      }
    ]
  ],
  "Percent": [
    [
      "line",
      {
        "x1": "19",
        "x2": "5",
        "y1": "5",
        "y2": "19",
        "key": "1x9vlm"
      }
    ],
    [
      "circle",
      {
        "cx": "6.5",
        "cy": "6.5",
        "r": "2.5",
        "key": "4mh3h7"
      }
    ],
    [
      "circle",
      {
        "cx": "17.5",
        "cy": "17.5",
        "r": "2.5",
        "key": "1mdrzq"
      }
    ]
  ],
  "Pilcrow": [
    [
      "path",
      {
        "d": "M13 4v16",
        "key": "8vvj80"
      }
    ],
    [
      "path",
      {
        "d": "M17 4v16",
        "key": "7dpous"
      }
    ],
    [
      "path",
      {
        "d": "M19 4H9.5a4.5 4.5 0 0 0 0 9H13",
        "key": "sh4n9v"
      }
    ]
  ],
  "FileCode": [
    [
      "path",
      {
        "d": "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z",
        "key": "1oefj6"
      }
    ],
    [
      "path",
      {
        "d": "M14 2v5a1 1 0 0 0 1 1h5",
        "key": "wfsgrz"
      }
    ],
    [
      "path",
      {
        "d": "M10 12.5 8 15l2 2.5",
        "key": "1tg20x"
      }
    ],
    [
      "path",
      {
        "d": "m14 12.5 2 2.5-2 2.5",
        "key": "yinavb"
      }
    ]
  ],
  "GitCompare": [
    [
      "circle",
      {
        "cx": "18",
        "cy": "18",
        "r": "3",
        "key": "1xkwt0"
      }
    ],
    [
      "circle",
      {
        "cx": "6",
        "cy": "6",
        "r": "3",
        "key": "1lh9wr"
      }
    ],
    [
      "path",
      {
        "d": "M13 6h3a2 2 0 0 1 2 2v7",
        "key": "1yeb86"
      }
    ],
    [
      "path",
      {
        "d": "M11 18H8a2 2 0 0 1-2-2V9",
        "key": "19pyzm"
      }
    ]
  ],
  "HeartPulse": [
    [
      "path",
      {
        "d": "M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5",
        "key": "mvr1a0"
      }
    ],
    [
      "path",
      {
        "d": "M3.22 13H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27",
        "key": "auskq0"
      }
    ]
  ],
  "Receipt": [
    [
      "path",
      {
        "d": "M12 17V7",
        "key": "pyj7ub"
      }
    ],
    [
      "path",
      {
        "d": "M16 8h-6a2 2 0 0 0 0 4h4a2 2 0 0 1 0 4H8",
        "key": "1elt7d"
      }
    ],
    [
      "path",
      {
        "d": "M4 3a1 1 0 0 1 1-1 1.3 1.3 0 0 1 .7.2l.933.6a1.3 1.3 0 0 0 1.4 0l.934-.6a1.3 1.3 0 0 1 1.4 0l.933.6a1.3 1.3 0 0 0 1.4 0l.933-.6a1.3 1.3 0 0 1 1.4 0l.934.6a1.3 1.3 0 0 0 1.4 0l.933-.6A1.3 1.3 0 0 1 19 2a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1 1.3 1.3 0 0 1-.7-.2l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.934.6a1.3 1.3 0 0 1-1.4 0l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-1.4 0l-.934-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-.7.2 1 1 0 0 1-1-1z",
        "key": "ycz6yz"
      }
    ]
  ],
  "Blend": [
    [
      "circle",
      {
        "cx": "9",
        "cy": "9",
        "r": "7",
        "key": "p2h5vp"
      }
    ],
    [
      "circle",
      {
        "cx": "15",
        "cy": "15",
        "r": "7",
        "key": "19ennj"
      }
    ]
  ],
  "Contrast": [
    [
      "circle",
      {
        "cx": "12",
        "cy": "12",
        "r": "10",
        "key": "1mglay"
      }
    ],
    [
      "path",
      {
        "d": "M12 18a6 6 0 0 0 0-12v12z",
        "key": "j4l70d"
      }
    ]
  ],
  "Fingerprint": [
    [
      "path",
      {
        "d": "M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4",
        "key": "1nerag"
      }
    ],
    [
      "path",
      {
        "d": "M14 13.12c0 2.38 0 6.38-1 8.88",
        "key": "o46ks0"
      }
    ],
    [
      "path",
      {
        "d": "M17.29 21.02c.12-.6.43-2.3.5-3.02",
        "key": "ptglia"
      }
    ],
    [
      "path",
      {
        "d": "M2 12a10 10 0 0 1 18-6",
        "key": "ydlgp0"
      }
    ],
    [
      "path",
      {
        "d": "M2 16h.01",
        "key": "1gqxmh"
      }
    ],
    [
      "path",
      {
        "d": "M21.8 16c.2-2 .131-5.354 0-6",
        "key": "drycrb"
      }
    ],
    [
      "path",
      {
        "d": "M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2",
        "key": "1tidbn"
      }
    ],
    [
      "path",
      {
        "d": "M8.65 22c.21-.66.45-1.32.57-2",
        "key": "13wd9y"
      }
    ],
    [
      "path",
      {
        "d": "M9 6.8a6 6 0 0 1 9 5.2v2",
        "key": "1fr1j5"
      }
    ]
  ],
  "Regex": [
    [
      "path",
      {
        "d": "M17 3v10",
        "key": "15fgeh"
      }
    ],
    [
      "path",
      {
        "d": "m12.67 5.5 8.66 5",
        "key": "1gpheq"
      }
    ],
    [
      "path",
      {
        "d": "m12.67 10.5 8.66-5",
        "key": "1dkfa6"
      }
    ],
    [
      "path",
      {
        "d": "M9 17a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-2z",
        "key": "swwfx4"
      }
    ]
  ],
  "Unlock": [
    [
      "rect",
      {
        "width": "18",
        "height": "11",
        "x": "3",
        "y": "11",
        "rx": "2",
        "ry": "2",
        "key": "1w4ew1"
      }
    ],
    [
      "path",
      {
        "d": "M7 11V7a5 5 0 0 1 9.9-1",
        "key": "1mm8w8"
      }
    ]
  ],
  "AppWindow": [
    [
      "rect",
      {
        "x": "2",
        "y": "4",
        "width": "20",
        "height": "16",
        "rx": "2",
        "key": "izxlao"
      }
    ],
    [
      "path",
      {
        "d": "M10 4v4",
        "key": "pp8u80"
      }
    ],
    [
      "path",
      {
        "d": "M2 8h20",
        "key": "d11cs7"
      }
    ],
    [
      "path",
      {
        "d": "M6 4v4",
        "key": "1svtjw"
      }
    ]
  ],
  "Merge": [
    [
      "path",
      {
        "d": "m8 6 4-4 4 4",
        "key": "ybng9g"
      }
    ],
    [
      "path",
      {
        "d": "M12 2v10.3a4 4 0 0 1-1.172 2.872L4 22",
        "key": "1hyw0i"
      }
    ],
    [
      "path",
      {
        "d": "m20 22-5-5",
        "key": "1m27yz"
      }
    ]
  ],
  "Scissors": [
    [
      "circle",
      {
        "cx": "6",
        "cy": "6",
        "r": "3",
        "key": "1lh9wr"
      }
    ],
    [
      "path",
      {
        "d": "M8.12 8.12 12 12",
        "key": "1alkpv"
      }
    ],
    [
      "path",
      {
        "d": "M20 4 8.12 15.88",
        "key": "xgtan2"
      }
    ],
    [
      "circle",
      {
        "cx": "6",
        "cy": "18",
        "r": "3",
        "key": "fqmcym"
      }
    ],
    [
      "path",
      {
        "d": "M14.8 14.8 20 20",
        "key": "ptml3r"
      }
    ]
  ],
  "FileOutput": [
    [
      "path",
      {
        "d": "M4.226 20.925A2 2 0 0 0 6 22h12a2 2 0 0 0 2-2V8a2.4 2.4 0 0 0-.706-1.706l-3.588-3.588A2.4 2.4 0 0 0 14 2H6a2 2 0 0 0-2 2v3.127",
        "key": "wfxp4w"
      }
    ],
    [
      "path",
      {
        "d": "M14 2v5a1 1 0 0 0 1 1h5",
        "key": "wfsgrz"
      }
    ],
    [
      "path",
      {
        "d": "m5 11-3 3",
        "key": "1dgrs4"
      }
    ],
    [
      "path",
      {
        "d": "m5 17-3-3h10",
        "key": "1mvvaf"
      }
    ]
  ],
  "FilePenLine": [
    [
      "path",
      {
        "d": "M14.364 13.634a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506l4.013-4.009a1 1 0 0 0-3.004-3.004z",
        "key": "ukzhwg"
      }
    ],
    [
      "path",
      {
        "d": "M14.487 7.858A1 1 0 0 1 14 7V2",
        "key": "1klhew"
      }
    ],
    [
      "path",
      {
        "d": "M20 19.645V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l2.516 2.516",
        "key": "rxaxab"
      }
    ],
    [
      "path",
      {
        "d": "M8 18h1",
        "key": "13wk12"
      }
    ]
  ],
  "FileText": [
    [
      "path",
      {
        "d": "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z",
        "key": "1oefj6"
      }
    ],
    [
      "path",
      {
        "d": "M14 2v5a1 1 0 0 0 1 1h5",
        "key": "wfsgrz"
      }
    ],
    [
      "path",
      {
        "d": "M10 9H8",
        "key": "b1mrlr"
      }
    ],
    [
      "path",
      {
        "d": "M16 13H8",
        "key": "t4e002"
      }
    ],
    [
      "path",
      {
        "d": "M16 17H8",
        "key": "z1uh3a"
      }
    ]
  ],
  "Barcode": [
    [
      "path",
      {
        "d": "M3 5v14",
        "key": "1nt18q"
      }
    ],
    [
      "path",
      {
        "d": "M8 5v14",
        "key": "1ybrkv"
      }
    ],
    [
      "path",
      {
        "d": "M12 5v14",
        "key": "s699le"
      }
    ],
    [
      "path",
      {
        "d": "M17 5v14",
        "key": "ycjyhj"
      }
    ],
    [
      "path",
      {
        "d": "M21 5v14",
        "key": "nzette"
      }
    ]
  ],
  "Star": [
    [
      "path",
      {
        "d": "M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z",
        "key": "r04s7s"
      }
    ]
  ],
  "Link": [
    [
      "path",
      {
        "d": "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71",
        "key": "1cjeqo"
      }
    ],
    [
      "path",
      {
        "d": "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
        "key": "19qd67"
      }
    ]
  ],
  "Dices": [
    [
      "rect",
      {
        "width": "12",
        "height": "12",
        "x": "2",
        "y": "10",
        "rx": "2",
        "ry": "2",
        "key": "6agr2n"
      }
    ],
    [
      "path",
      {
        "d": "m17.92 14 3.5-3.5a2.24 2.24 0 0 0 0-3l-5-4.92a2.24 2.24 0 0 0-3 0L10 6",
        "key": "1o487t"
      }
    ],
    [
      "path",
      {
        "d": "M6 18h.01",
        "key": "uhywen"
      }
    ],
    [
      "path",
      {
        "d": "M10 14h.01",
        "key": "ssrbsk"
      }
    ],
    [
      "path",
      {
        "d": "M15 6h.01",
        "key": "cblpky"
      }
    ],
    [
      "path",
      {
        "d": "M18 9h.01",
        "key": "2061c0"
      }
    ]
  ],
  "CalendarDays": [
    [
      "path",
      {
        "d": "M8 2v4",
        "key": "1cmpym"
      }
    ],
    [
      "path",
      {
        "d": "M16 2v4",
        "key": "4m81vk"
      }
    ],
    [
      "rect",
      {
        "width": "18",
        "height": "18",
        "x": "3",
        "y": "4",
        "rx": "2",
        "key": "1hopcy"
      }
    ],
    [
      "path",
      {
        "d": "M3 10h18",
        "key": "8toen8"
      }
    ],
    [
      "path",
      {
        "d": "M8 14h.01",
        "key": "6423bh"
      }
    ],
    [
      "path",
      {
        "d": "M12 14h.01",
        "key": "1etili"
      }
    ],
    [
      "path",
      {
        "d": "M16 14h.01",
        "key": "1gbofw"
      }
    ],
    [
      "path",
      {
        "d": "M8 18h.01",
        "key": "lrp35t"
      }
    ],
    [
      "path",
      {
        "d": "M12 18h.01",
        "key": "mhygvu"
      }
    ],
    [
      "path",
      {
        "d": "M16 18h.01",
        "key": "kzsmim"
      }
    ]
  ],
  "Table2": [
    [
      "path",
      {
        "d": "M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18",
        "key": "gugj83"
      }
    ]
  ],
  "Tag": [
    [
      "path",
      {
        "d": "M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z",
        "key": "vktsd0"
      }
    ],
    [
      "circle",
      {
        "cx": "7.5",
        "cy": "7.5",
        "r": ".5",
        "fill": "currentColor",
        "key": "kqv944"
      }
    ]
  ],
  "Workflow": [
    [
      "rect",
      {
        "width": "8",
        "height": "8",
        "x": "3",
        "y": "3",
        "rx": "2",
        "key": "by2w9f"
      }
    ],
    [
      "path",
      {
        "d": "M7 11v4a2 2 0 0 0 2 2h4",
        "key": "xkn7yn"
      }
    ],
    [
      "rect",
      {
        "width": "8",
        "height": "8",
        "x": "13",
        "y": "13",
        "rx": "2",
        "key": "1cgmvn"
      }
    ]
  ],
  "SquareCode": [
    [
      "path",
      {
        "d": "m10 9-3 3 3 3",
        "key": "1oro0q"
      }
    ],
    [
      "path",
      {
        "d": "m14 15 3-3-3-3",
        "key": "bz13h7"
      }
    ],
    [
      "rect",
      {
        "x": "3",
        "y": "3",
        "width": "18",
        "height": "18",
        "rx": "2",
        "key": "h1oib"
      }
    ]
  ],
  "Factory": [
    [
      "path",
      {
        "d": "M12 16h.01",
        "key": "1drbdi"
      }
    ],
    [
      "path",
      {
        "d": "M16 16h.01",
        "key": "1f9h7w"
      }
    ],
    [
      "path",
      {
        "d": "M3 19a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5a.5.5 0 0 0-.769-.422l-4.462 2.844A.5.5 0 0 1 15 10.5v-2a.5.5 0 0 0-.769-.422L9.77 10.922A.5.5 0 0 1 9 10.5V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z",
        "key": "1iv0i2"
      }
    ],
    [
      "path",
      {
        "d": "M8 16h.01",
        "key": "18s6g9"
      }
    ]
  ],
  "TrendingUp": [
    [
      "path",
      {
        "d": "M16 7h6v6",
        "key": "box55l"
      }
    ],
    [
      "path",
      {
        "d": "m22 7-8.5 8.5-5-5L2 17",
        "key": "1t1m79"
      }
    ]
  ],
  "BadgePercent": [
    [
      "path",
      {
        "d": "M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z",
        "key": "3c2336"
      }
    ],
    [
      "path",
      {
        "d": "m15 9-6 6",
        "key": "1uzhvr"
      }
    ],
    [
      "path",
      {
        "d": "M9 9h.01",
        "key": "1q5me6"
      }
    ],
    [
      "path",
      {
        "d": "M15 15h.01",
        "key": "lqbp3k"
      }
    ]
  ],
  "Landmark": [
    [
      "path",
      {
        "d": "M10 18v-7",
        "key": "wt116b"
      }
    ],
    [
      "path",
      {
        "d": "M11.12 2.198a2 2 0 0 1 1.76.006l7.866 3.847c.476.233.31.949-.22.949H3.474c-.53 0-.695-.716-.22-.949z",
        "key": "1m329m"
      }
    ],
    [
      "path",
      {
        "d": "M14 18v-7",
        "key": "vav6t3"
      }
    ],
    [
      "path",
      {
        "d": "M18 18v-7",
        "key": "aexdmj"
      }
    ],
    [
      "path",
      {
        "d": "M3 22h18",
        "key": "8prr45"
      }
    ],
    [
      "path",
      {
        "d": "M6 18v-7",
        "key": "1ivflk"
      }
    ]
  ],
  "Target": [
    [
      "circle",
      {
        "cx": "12",
        "cy": "12",
        "r": "10",
        "key": "1mglay"
      }
    ],
    [
      "circle",
      {
        "cx": "12",
        "cy": "12",
        "r": "6",
        "key": "1vlfrh"
      }
    ],
    [
      "circle",
      {
        "cx": "12",
        "cy": "12",
        "r": "2",
        "key": "1c9p78"
      }
    ]
  ],
  "HandCoins": [
    [
      "path",
      {
        "d": "M11 15h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 17",
        "key": "geh8rc"
      }
    ],
    [
      "path",
      {
        "d": "m7 21 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9",
        "key": "1fto5m"
      }
    ],
    [
      "path",
      {
        "d": "m2 16 6 6",
        "key": "1pfhp9"
      }
    ],
    [
      "circle",
      {
        "cx": "16",
        "cy": "9",
        "r": "2.9",
        "key": "1n0dlu"
      }
    ],
    [
      "circle",
      {
        "cx": "6",
        "cy": "5",
        "r": "3",
        "key": "151irh"
      }
    ]
  ]
};
