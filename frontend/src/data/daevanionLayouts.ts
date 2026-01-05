export interface NodePosition {
    id: number;
    x: number;
    y: number;
    row: number;
    col: number;
    type: 'common' | 'rare' | 'unique' | 'legend' | 'start';
    connections: number[];
}

export const DAEVANION_LAYOUT: NodePosition[] = [
    {
        "id": 0,
        "x": 400,
        "y": 400,
        "type": "start",
        "row": 6,
        "col": 6,
        "connections": [
            1,
            2
        ]
    },
    {
        "id": 1,
        "x": 400,
        "y": 320,
        "type": "common",
        "row": 5,
        "col": 6,
        "connections": [
            0,
            3,
            4
        ]
    },
    {
        "id": 2,
        "x": 400,
        "y": 480,
        "type": "common",
        "row": 7,
        "col": 6,
        "connections": [
            0,
            7,
            8
        ]
    },
    {
        "id": 3,
        "x": 320,
        "y": 320,
        "type": "common",
        "row": 5,
        "col": 5,
        "connections": [
            10,
            12,
            1
        ]
    },
    {
        "id": 4,
        "x": 480,
        "y": 320,
        "type": "common",
        "row": 5,
        "col": 7,
        "connections": [
            11,
            1,
            13
        ]
    },
    {
        "id": 5,
        "x": 240,
        "y": 400,
        "type": "common",
        "row": 6,
        "col": 4,
        "connections": [
            12,
            14
        ]
    },
    {
        "id": 6,
        "x": 560,
        "y": 400,
        "type": "common",
        "row": 6,
        "col": 8,
        "connections": [
            13,
            15
        ]
    },
    {
        "id": 7,
        "x": 320,
        "y": 480,
        "type": "common",
        "row": 7,
        "col": 5,
        "connections": [
            16,
            14,
            2
        ]
    },
    {
        "id": 8,
        "x": 480,
        "y": 480,
        "type": "common",
        "row": 7,
        "col": 7,
        "connections": [
            17,
            2,
            15
        ]
    },
    {
        "id": 9,
        "x": 400,
        "y": 160,
        "type": "legend",
        "row": 3,
        "col": 6,
        "connections": [
            19,
            20
        ]
    },
    {
        "id": 10,
        "x": 320,
        "y": 240,
        "type": "common",
        "row": 4,
        "col": 5,
        "connections": [
            19,
            3
        ]
    },
    {
        "id": 11,
        "x": 480,
        "y": 240,
        "type": "common",
        "row": 4,
        "col": 7,
        "connections": [
            20,
            4
        ]
    },
    {
        "id": 12,
        "x": 240,
        "y": 320,
        "type": "common",
        "row": 5,
        "col": 4,
        "connections": [
            5,
            21,
            3
        ]
    },
    {
        "id": 13,
        "x": 560,
        "y": 320,
        "type": "rare",
        "row": 5,
        "col": 8,
        "connections": [
            6,
            4,
            22
        ]
    },
    {
        "id": 14,
        "x": 240,
        "y": 480,
        "type": "rare",
        "row": 7,
        "col": 4,
        "connections": [
            5,
            23,
            7
        ]
    },
    {
        "id": 15,
        "x": 560,
        "y": 480,
        "type": "common",
        "row": 7,
        "col": 8,
        "connections": [
            6,
            8,
            24
        ]
    },
    {
        "id": 16,
        "x": 320,
        "y": 560,
        "type": "common",
        "row": 8,
        "col": 5,
        "connections": [
            7,
            25
        ]
    },
    {
        "id": 17,
        "x": 480,
        "y": 560,
        "type": "common",
        "row": 8,
        "col": 7,
        "connections": [
            8,
            26
        ]
    },
    {
        "id": 18,
        "x": 400,
        "y": 640,
        "type": "legend",
        "row": 9,
        "col": 6,
        "connections": [
            25,
            26
        ]
    },
    {
        "id": 19,
        "x": 320,
        "y": 160,
        "type": "common",
        "row": 3,
        "col": 5,
        "connections": [
            28,
            10,
            9
        ]
    },
    {
        "id": 20,
        "x": 480,
        "y": 160,
        "type": "common",
        "row": 3,
        "col": 7,
        "connections": [
            29,
            11,
            9
        ]
    },
    {
        "id": 21,
        "x": 160,
        "y": 320,
        "type": "legend",
        "row": 5,
        "col": 3,
        "connections": [
            31,
            12
        ]
    },
    {
        "id": 22,
        "x": 640,
        "y": 320,
        "type": "common",
        "row": 5,
        "col": 9,
        "connections": [
            30,
            13,
            32
        ]
    },
    {
        "id": 23,
        "x": 160,
        "y": 480,
        "type": "common",
        "row": 7,
        "col": 3,
        "connections": [
            37,
            35,
            14
        ]
    },
    {
        "id": 24,
        "x": 640,
        "y": 480,
        "type": "legend",
        "row": 7,
        "col": 9,
        "connections": [
            15,
            36
        ]
    },
    {
        "id": 25,
        "x": 320,
        "y": 640,
        "type": "common",
        "row": 9,
        "col": 5,
        "connections": [
            16,
            38,
            18
        ]
    },
    {
        "id": 26,
        "x": 480,
        "y": 640,
        "type": "common",
        "row": 9,
        "col": 7,
        "connections": [
            17,
            39,
            18
        ]
    },
    {
        "id": 27,
        "x": 400,
        "y": 0,
        "type": "common",
        "row": 1,
        "col": 6,
        "connections": [
            41,
            42
        ]
    },
    {
        "id": 28,
        "x": 320,
        "y": 80,
        "type": "common",
        "row": 2,
        "col": 5,
        "connections": [
            41,
            19,
            43
        ]
    },
    {
        "id": 29,
        "x": 480,
        "y": 80,
        "type": "common",
        "row": 2,
        "col": 7,
        "connections": [
            42,
            20,
            44
        ]
    },
    {
        "id": 30,
        "x": 640,
        "y": 240,
        "type": "common",
        "row": 4,
        "col": 9,
        "connections": [
            46,
            22
        ]
    },
    {
        "id": 31,
        "x": 80,
        "y": 320,
        "type": "common",
        "row": 5,
        "col": 2,
        "connections": [
            47,
            48,
            21
        ]
    },
    {
        "id": 32,
        "x": 720,
        "y": 320,
        "type": "common",
        "row": 5,
        "col": 10,
        "connections": [
            22,
            49
        ]
    },
    {
        "id": 33,
        "x": 0,
        "y": 400,
        "type": "legend",
        "row": 6,
        "col": 1,
        "connections": [
            48,
            50
        ]
    },
    {
        "id": 34,
        "x": 800,
        "y": 400,
        "type": "legend",
        "row": 6,
        "col": 11,
        "connections": [
            49,
            51
        ]
    },
    {
        "id": 35,
        "x": 80,
        "y": 480,
        "type": "common",
        "row": 7,
        "col": 2,
        "connections": [
            50,
            23
        ]
    },
    {
        "id": 36,
        "x": 720,
        "y": 480,
        "type": "common",
        "row": 7,
        "col": 10,
        "connections": [
            52,
            24,
            51
        ]
    },
    {
        "id": 37,
        "x": 160,
        "y": 560,
        "type": "common",
        "row": 8,
        "col": 3,
        "connections": [
            23,
            53
        ]
    },
    {
        "id": 38,
        "x": 320,
        "y": 720,
        "type": "common",
        "row": 10,
        "col": 5,
        "connections": [
            25,
            57,
            55
        ]
    },
    {
        "id": 39,
        "x": 480,
        "y": 720,
        "type": "common",
        "row": 10,
        "col": 7,
        "connections": [
            26,
            58,
            56
        ]
    },
    {
        "id": 40,
        "x": 400,
        "y": 800,
        "type": "common",
        "row": 11,
        "col": 6,
        "connections": [
            57,
            58
        ]
    },
    {
        "id": 41,
        "x": 320,
        "y": 0,
        "type": "rare",
        "row": 1,
        "col": 5,
        "connections": [
            28,
            27
        ]
    },
    {
        "id": 42,
        "x": 480,
        "y": 0,
        "type": "legend",
        "row": 1,
        "col": 7,
        "connections": [
            29,
            27
        ]
    },
    {
        "id": 43,
        "x": 240,
        "y": 80,
        "type": "common",
        "row": 2,
        "col": 4,
        "connections": [
            59,
            28
        ]
    },
    {
        "id": 44,
        "x": 560,
        "y": 80,
        "type": "common",
        "row": 2,
        "col": 8,
        "connections": [
            29,
            60
        ]
    },
    {
        "id": 45,
        "x": 160,
        "y": 160,
        "type": "common",
        "row": 3,
        "col": 3,
        "connections": [
            59,
            61
        ]
    },
    {
        "id": 46,
        "x": 640,
        "y": 160,
        "type": "legend",
        "row": 3,
        "col": 9,
        "connections": [
            60,
            30,
            62
        ]
    },
    {
        "id": 47,
        "x": 80,
        "y": 240,
        "type": "common",
        "row": 4,
        "col": 2,
        "connections": [
            61,
            31
        ]
    },
    {
        "id": 48,
        "x": 0,
        "y": 320,
        "type": "common",
        "row": 5,
        "col": 1,
        "connections": [
            33,
            31
        ]
    },
    {
        "id": 49,
        "x": 800,
        "y": 320,
        "type": "common",
        "row": 5,
        "col": 11,
        "connections": [
            63,
            34,
            32
        ]
    },
    {
        "id": 50,
        "x": 0,
        "y": 480,
        "type": "common",
        "row": 7,
        "col": 1,
        "connections": [
            33,
            64,
            35
        ]
    },
    {
        "id": 51,
        "x": 800,
        "y": 480,
        "type": "common",
        "row": 7,
        "col": 11,
        "connections": [
            34,
            36
        ]
    },
    {
        "id": 52,
        "x": 720,
        "y": 560,
        "type": "common",
        "row": 8,
        "col": 10,
        "connections": [
            36,
            66
        ]
    },
    {
        "id": 53,
        "x": 160,
        "y": 640,
        "type": "legend",
        "row": 9,
        "col": 3,
        "connections": [
            37,
            67,
            65
        ]
    },
    {
        "id": 54,
        "x": 640,
        "y": 640,
        "type": "common",
        "row": 9,
        "col": 9,
        "connections": [
            68,
            66
        ]
    },
    {
        "id": 55,
        "x": 240,
        "y": 720,
        "type": "common",
        "row": 10,
        "col": 4,
        "connections": [
            67,
            38
        ]
    },
    {
        "id": 56,
        "x": 560,
        "y": 720,
        "type": "common",
        "row": 10,
        "col": 8,
        "connections": [
            39,
            68
        ]
    },
    {
        "id": 57,
        "x": 320,
        "y": 800,
        "type": "legend",
        "row": 11,
        "col": 5,
        "connections": [
            38,
            40
        ]
    },
    {
        "id": 58,
        "x": 480,
        "y": 800,
        "type": "rare",
        "row": 11,
        "col": 7,
        "connections": [
            39,
            40
        ]
    },
    {
        "id": 59,
        "x": 160,
        "y": 80,
        "type": "legend",
        "row": 2,
        "col": 3,
        "connections": [
            69,
            45,
            43
        ]
    },
    {
        "id": 60,
        "x": 640,
        "y": 80,
        "type": "common",
        "row": 2,
        "col": 9,
        "connections": [
            70,
            46,
            44
        ]
    },
    {
        "id": 61,
        "x": 80,
        "y": 160,
        "type": "common",
        "row": 3,
        "col": 2,
        "connections": [
            47,
            71,
            45
        ]
    },
    {
        "id": 62,
        "x": 720,
        "y": 160,
        "type": "common",
        "row": 3,
        "col": 10,
        "connections": [
            46,
            72
        ]
    },
    {
        "id": 63,
        "x": 800,
        "y": 240,
        "type": "common",
        "row": 4,
        "col": 11,
        "connections": [
            72,
            49
        ]
    },
    {
        "id": 64,
        "x": 0,
        "y": 560,
        "type": "common",
        "row": 8,
        "col": 1,
        "connections": [
            50,
            73
        ]
    },
    {
        "id": 65,
        "x": 80,
        "y": 640,
        "type": "common",
        "row": 9,
        "col": 2,
        "connections": [
            73,
            53
        ]
    },
    {
        "id": 66,
        "x": 720,
        "y": 640,
        "type": "common",
        "row": 9,
        "col": 10,
        "connections": [
            52,
            54,
            74
        ]
    },
    {
        "id": 67,
        "x": 160,
        "y": 720,
        "type": "common",
        "row": 10,
        "col": 3,
        "connections": [
            53,
            75,
            55
        ]
    },
    {
        "id": 68,
        "x": 640,
        "y": 720,
        "type": "legend",
        "row": 10,
        "col": 9,
        "connections": [
            54,
            76,
            56
        ]
    },
    {
        "id": 69,
        "x": 160,
        "y": 0,
        "type": "common",
        "row": 1,
        "col": 3,
        "connections": [
            59,
            77
        ]
    },
    {
        "id": 70,
        "x": 640,
        "y": 0,
        "type": "rare",
        "row": 1,
        "col": 9,
        "connections": [
            60,
            78
        ]
    },
    {
        "id": 71,
        "x": 0,
        "y": 160,
        "type": "rare",
        "row": 3,
        "col": 1,
        "connections": [
            79,
            61
        ]
    },
    {
        "id": 72,
        "x": 800,
        "y": 160,
        "type": "rare",
        "row": 3,
        "col": 11,
        "connections": [
            80,
            63,
            62
        ]
    },
    {
        "id": 73,
        "x": 0,
        "y": 640,
        "type": "rare",
        "row": 9,
        "col": 1,
        "connections": [
            64,
            81,
            65
        ]
    },
    {
        "id": 74,
        "x": 800,
        "y": 640,
        "type": "rare",
        "row": 9,
        "col": 11,
        "connections": [
            82,
            66
        ]
    },
    {
        "id": 75,
        "x": 160,
        "y": 800,
        "type": "rare",
        "row": 11,
        "col": 3,
        "connections": [
            67,
            83
        ]
    },
    {
        "id": 76,
        "x": 640,
        "y": 800,
        "type": "common",
        "row": 11,
        "col": 9,
        "connections": [
            68,
            84
        ]
    },
    {
        "id": 77,
        "x": 80,
        "y": 0,
        "type": "common",
        "row": 1,
        "col": 2,
        "connections": [
            85,
            69
        ]
    },
    {
        "id": 78,
        "x": 720,
        "y": 0,
        "type": "common",
        "row": 1,
        "col": 10,
        "connections": [
            70,
            86
        ]
    },
    {
        "id": 79,
        "x": 0,
        "y": 80,
        "type": "common",
        "row": 2,
        "col": 1,
        "connections": [
            85,
            71
        ]
    },
    {
        "id": 80,
        "x": 800,
        "y": 80,
        "type": "common",
        "row": 2,
        "col": 11,
        "connections": [
            86,
            72
        ]
    },
    {
        "id": 81,
        "x": 0,
        "y": 720,
        "type": "common",
        "row": 10,
        "col": 1,
        "connections": [
            73,
            87
        ]
    },
    {
        "id": 82,
        "x": 800,
        "y": 720,
        "type": "common",
        "row": 10,
        "col": 11,
        "connections": [
            74,
            88
        ]
    },
    {
        "id": 83,
        "x": 80,
        "y": 800,
        "type": "common",
        "row": 11,
        "col": 2,
        "connections": [
            87,
            75
        ]
    },
    {
        "id": 84,
        "x": 720,
        "y": 800,
        "type": "common",
        "row": 11,
        "col": 10,
        "connections": [
            76,
            88
        ]
    },
    {
        "id": 85,
        "x": 0,
        "y": 0,
        "type": "unique",
        "row": 1,
        "col": 1,
        "connections": [
            79,
            77
        ]
    },
    {
        "id": 86,
        "x": 800,
        "y": 0,
        "type": "unique",
        "row": 1,
        "col": 11,
        "connections": [
            80,
            78
        ]
    },
    {
        "id": 87,
        "x": 0,
        "y": 800,
        "type": "unique",
        "row": 11,
        "col": 1,
        "connections": [
            81,
            83
        ]
    },
    {
        "id": 88,
        "x": 800,
        "y": 800,
        "type": "unique",
        "row": 11,
        "col": 11,
        "connections": [
            82,
            84
        ]
    }
];

export const TOTAL_NODES = 89;

