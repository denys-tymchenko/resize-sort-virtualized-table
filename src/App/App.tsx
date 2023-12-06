import { useEffect, useMemo, useRef, useState } from 'react';
import Table from '../Components/Table';
import { TableSchema } from '../Components/Table/types';
import Icon from '../Components/Icon';

import './style.css';

interface UserData {
  firstName: string;
  lastName: string;
  gender: string;
  email: string;
  phone: string;
  avatar: string;
  age: number;
  birthday: Date;
}
const App = () => {
  const [data, setData] = useState<UserData[]>([]);

  const wrapperRef = useRef<HTMLDivElement>(null);

  const schema: TableSchema[] = useMemo(() => {
    return [
      {
        width: 100,
        name: 'Actions',
        prop: 'actions',
        sortable: false,
        clickable: false,
        resizable: false,
        cellContent: (rowData: UserData) => (
          <div className='user-actions'>
            <Icon name='edit' />
            <Icon name='delete' />
          </div>
        )
      },
      {
        width: 100,
        name: 'Avatar',
        prop: 'avatar',
        sortable: false,
        clickable: false,
        resizable: false,
        cellContent: (rowData: UserData) => (
          <div className='avatar'>
            <img src={rowData.avatar} alt="avatar" />
          </div>
        )
      },
      {
        width: 180,
        name: 'Name',
        prop: 'name',
        value: (rowData: UserData) => rowData.firstName,
        cellContent: (rowData: UserData) => rowData.firstName,
      },
      {
        width: 180,
        name: 'Surname',
        prop: 'surname',
        value: (rowData: UserData) => rowData.lastName,
        cellContent: (rowData: UserData) => rowData.lastName
      },
      {
        name: 'Gender',
        prop: 'gender',
        width: 75,
        value: (rowData: UserData) => rowData.gender,
        cellContent: (rowData: UserData) => rowData.gender,
      },
      {
        name: 'Age',
        prop: 'age',
        width: 75,
        value: (rowData: UserData) => rowData.age,
        cellContent: (rowData: UserData) => rowData.age,
      },
      {
        name: 'Birthday',
        prop: 'birthday',
        width: 100,
        value: (rowData: UserData) => new Date(rowData.birthday).getTime(),
        cellContent: (rowData: UserData) => new Date(rowData.birthday).toLocaleDateString(),
      },
      {
        name: 'Email',
        prop: 'email',
        width: 300,
        value: (rowData: UserData) => rowData.email,
        cellContent: (rowData: UserData) => rowData.email,
      },
      {
        width: 100,
        name: 'Phone',
        prop: 'phone',
        value: (rowData: UserData) => rowData.phone,
        cellContent: (rowData: UserData) => rowData.phone,
      }
    ]
  }, []);

  useEffect(() => {
    const getData = async () => {
      try {
        fetch('https://randomuser.me/api/?results=1000')
          .then((response) =>
            response.json().then((data) => {
              const users: UserData[] = data.results.map((user: any) => ({
                firstName: user.name.first,
                lastName: user.name.last,
                email: user.email,
                gender: user.gender,
                phone: user.phone,
                avatar: user.picture.large,
                age: user.dob.age,
                birthday: new Date(user.dob.date)
              }));
              setData(users);
            }))
      }
      catch {
        setData([]);
      }
    }

    getData();
  }, []);

  return (
    <div className='App' ref={wrapperRef}>
      {data.length > 0 &&
        <Table data={data} schema={schema} wrapperRef={wrapperRef}/>}
    </div>
  );
}

export default App;
